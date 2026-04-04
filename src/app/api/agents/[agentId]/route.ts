import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agent, agentTask, agentWorkLog } from "@/db/schema/agent";
import { work as workSchema, workOutput } from "@/db/schema/work";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { executeWork } from "@/lib/ai-execute";

async function validateAgent(agentId: string, apiKey: string) {
  const [agentRecord] = await db
    .select()
    .from(agent)
    .where(and(eq(agent.id, agentId), eq(agent.isActive, true)))
    .limit(1);
  
  if (!agentRecord) return null;
  
  const validKey = agentRecord.config?.apiKey === apiKey;
  if (!validKey) return null;
  
  await db.update(agent).set({ lastSeenAt: new Date() }).where(eq(agent.id, agentId));
  
  return agentRecord;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing auth" }, { status: 401 });
    }
    
    const apiKey = authHeader.slice(7);
    const agentRecord = await validateAgent(agentId, apiKey);
    
    if (!agentRecord) {
      return NextResponse.json({ error: "Invalid agent" }, { status: 401 });
    }
    
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    
    if (action === "next") {
      const agentWorkTypes = agentRecord.workTypes || ["task"];
      
      const [task] = await db
        .select()
        .from(agentTask)
        .where(and(
          eq(agentTask.agentId, agentId),
          eq(agentTask.status, "pending")
        ))
        .orderBy(agentTask.createdAt)
        .limit(1);
      
      if (task) {
        await db.update(agentTask).set({
          status: "assigned",
          assignedAt: new Date(),
        }).where(eq(agentTask.id, task.id));
        
        await db.insert(agentWorkLog).values({
          id: nanoid(),
          agentId,
          taskId: task.id,
          action: "task_assigned",
          message: `Task ${task.id} assigned to agent`,
        });
        
        return NextResponse.json({ task, execute: false });
      }
      
      if (agentRecord.agentType === "ai" && agentRecord.teamId) {
        const workItems = await db
          .select()
          .from(workSchema)
          .where(and(
            eq(workSchema.teamId, agentRecord.teamId),
            or(
              and(
                isNull(workSchema.aiStatus),
                eq(workSchema.stage, "new")
              ),
              eq(workSchema.aiStatus, "assigned")
            ),
            or(
              isNull(workSchema.aiAgentId),
              eq(workSchema.aiAgentId, agentId)
            )
          ))
          .orderBy(workSchema.priority, workSchema.createdAt)
          .limit(1);
        
        if (workItems.length > 0) {
          const workItem = workItems[0];
          
          await db.update(workSchema).set({
            aiAgentId: agentId,
            aiStatus: "running",
            aiStartedAt: new Date(),
          }).where(eq(workSchema.id, workItem.id));
          
          await db.insert(agentWorkLog).values({
            id: nanoid(),
            agentId,
            workId: workItem.id,
            action: "work_started",
            message: `AI starting work: ${workItem.title}`,
          });
          
          return NextResponse.json({
            task: null,
            work: workItem,
            execute: true,
          });
        }
      }
      
      return NextResponse.json({ task: null, work: null, execute: false });
    }
    
    if (action === "logs") {
      const logs = await db
        .select()
        .from(agentWorkLog)
        .where(eq(agentWorkLog.agentId, agentId))
        .orderBy(desc(agentWorkLog.createdAt))
        .limit(50);
      
      return NextResponse.json({ logs });
    }
    
    const tasks = await db
      .select()
      .from(agentTask)
      .where(eq(agentTask.agentId, agentId))
      .orderBy(desc(agentTask.createdAt))
      .limit(20);
    
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Agent API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing auth" }, { status: 401 });
    }
    
    const apiKey = authHeader.slice(7);
    const agentRecord = await validateAgent(agentId, apiKey);
    
    if (!agentRecord) {
      return NextResponse.json({ error: "Invalid agent" }, { status: 401 });
    }
    
    const body = await request.json();
    const { taskId, action, result, error, message, workId } = body;
    
    if (action === "start") {
      if (taskId) {
        await db.update(agentTask).set({
          status: "in_progress",
          startedAt: new Date(),
        }).where(eq(agentTask.id, taskId));
        
        await db.insert(agentWorkLog).values({
          id: nanoid(),
          agentId,
          taskId,
          action: "task_started",
          message: message || "Task started",
        });
      }
      
      if (workId) {
        await db.update(workSchema).set({
          aiStatus: "running",
          aiStartedAt: new Date(),
        }).where(eq(workSchema.id, workId));
        
        await db.insert(agentWorkLog).values({
          id: nanoid(),
          agentId,
          workId,
          action: "work_started",
          message: message || "AI started work",
        });
      }
      
      return NextResponse.json({ success: true });
    }
    
    if (action === "complete") {
      if (taskId) {
        await db.update(agentTask).set({
          status: "completed",
          completedAt: new Date(),
          result: result || {},
        }).where(eq(agentTask.id, taskId));
        
        await db.insert(agentWorkLog).values({
          id: nanoid(),
          agentId,
          taskId,
          action: "task_completed",
          message: message || "Task completed successfully",
          metadata: result,
        });
      }
      
      if (workId) {
        await db.update(workSchema).set({
          aiStatus: "completed",
          aiCompletedAt: new Date(),
        }).where(eq(workSchema.id, workId));
        
        const ownerId = agentRecord.ownerId || "system";
        
        if (result?.output) {
          await db.insert(workOutput).values({
            id: nanoid(),
            workId,
            version: 1,
            content: { markdown: result.output },
            contentType: "markdown",
            submittedBy: ownerId,
          });
        }
        
        await db.insert(agentWorkLog).values({
          id: nanoid(),
          agentId,
          workId,
          action: "work_completed",
          message: message || "AI completed work",
          metadata: result,
        });
      }
      
      return NextResponse.json({ success: true });
    }
    
    if (action === "execute") {
      if (!workId) {
        return NextResponse.json({ error: "workId required" }, { status: 400 });
      }
      
      const [workItem] = await db
        .select()
        .from(workSchema)
        .where(eq(workSchema.id, workId))
        .limit(1);
      
      if (!workItem) {
        return NextResponse.json({ error: "Work not found" }, { status: 404 });
      }
      
      await db.update(workSchema).set({
        aiStatus: "running",
        aiStartedAt: new Date(),
      }).where(eq(workSchema.id, workId));
      
      await db.insert(agentWorkLog).values({
        id: nanoid(),
        agentId,
        workId,
        action: "ai_executing",
        message: `AI executing: ${workItem.title}`,
      });
      
      const executionResult = await executeWork({
        workId: workItem.id,
        title: workItem.title,
        description: workItem.description,
        instructions: workItem.instructions,
        successCriteria: workItem.successCriteria,
        workType: workItem.type,
        outputFormat: agentRecord.outputFormat || "markdown",
        systemPrompt: agentRecord.config?.systemPrompt,
      });
      
      if (executionResult.success && executionResult.output) {
        await db.update(workSchema).set({
          aiStatus: "completed",
          aiCompletedAt: new Date(),
        }).where(eq(workSchema.id, workId));
        
        const ownerId = agentRecord.ownerId || "system";
        
        await db.insert(workOutput).values({
          id: nanoid(),
          workId,
          version: 1,
          content: { 
            markdown: executionResult.output,
            model: executionResult.model,
          },
          contentType: "markdown",
          submittedBy: ownerId,
        });
        
        await db.insert(agentWorkLog).values({
          id: nanoid(),
          agentId,
          workId,
          action: "ai_completed",
          message: "AI execution completed",
          metadata: { model: executionResult.model },
        });
        
        return NextResponse.json({
          success: true,
          output: executionResult.output,
          model: executionResult.model,
        });
      } else {
        await db.update(workSchema).set({
          aiStatus: "failed",
          aiError: executionResult.error,
        }).where(eq(workSchema.id, workId));
        
        await db.insert(agentWorkLog).values({
          id: nanoid(),
          agentId,
          workId,
          action: "ai_failed",
          message: `AI execution failed: ${executionResult.error}`,
          metadata: { error: executionResult.error },
        });
        
        return NextResponse.json({
          success: false,
          error: executionResult.error,
        });
      }
    }
    
    if (action === "fail") {
      if (taskId) {
        const task = await db.select().from(agentTask).where(eq(agentTask.id, taskId)).limit(1);
        const retryCount = parseInt(task[0]?.retryCount || "0");
        const maxRetries = parseInt(task[0]?.maxRetries || "3");
        
        if (retryCount < maxRetries) {
          await db.update(agentTask).set({
            status: "pending",
            retryCount: String(retryCount + 1),
            error,
          }).where(eq(agentTask.id, taskId));
          
          await db.insert(agentWorkLog).values({
            id: nanoid(),
            agentId,
            taskId,
            action: "task_retrying",
            message: `Task failed, will retry (${retryCount + 1}/${maxRetries})`,
            metadata: { error },
          });
        } else {
          await db.update(agentTask).set({
            status: "failed",
            error,
          }).where(eq(agentTask.id, taskId));
          
          await db.insert(agentWorkLog).values({
            id: nanoid(),
            agentId,
            taskId,
            action: "task_failed",
            message: `Task failed after ${maxRetries} retries`,
            metadata: { error },
          });
        }
        
        return NextResponse.json({ success: true, willRetry: retryCount < maxRetries });
      }
      
      if (workId) {
        await db.update(workSchema).set({
          aiStatus: "failed",
          aiError: error,
        }).where(eq(workSchema.id, workId));
        
        await db.insert(agentWorkLog).values({
          id: nanoid(),
          agentId,
          workId,
          action: "work_failed",
          message: `Work failed: ${error}`,
          metadata: { error },
        });
        
        return NextResponse.json({ success: true });
      }
      
      return NextResponse.json({ error: "taskId or workId required" }, { status: 400 });
    }
    
    if (action === "heartbeat") {
      await db.update(agent).set({ lastSeenAt: new Date() }).where(eq(agent.id, agentId));
      
      await db.insert(agentWorkLog).values({
        id: nanoid(),
        agentId,
        action: "heartbeat",
        message: message || "Agent heartbeat",
      });
      
      return NextResponse.json({ success: true });
    }
    
    if (action === "log") {
      await db.insert(agentWorkLog).values({
        id: nanoid(),
        agentId,
        taskId,
        workId,
        action: "log",
        message,
        metadata: body.metadata,
      });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Agent API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    
    await db.delete(agentWorkLog).where(eq(agentWorkLog.agentId, agentId));
    await db.delete(agentTask).where(eq(agentTask.agentId, agentId));
    await db.delete(agent).where(eq(agent.id, agentId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE agent error:", error);
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 });
  }
}
