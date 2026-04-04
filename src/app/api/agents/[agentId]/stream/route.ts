import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agent, agentTask, agentWorkLog } from "@/db/schema/agent";
import { work as workSchema, workOutput } from "@/db/schema/work";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { executeWorkStream, WORK_TYPE_PROMPTS, type WorkType } from "@/lib/ai-execute";

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
      return new NextResponse("Missing auth", { status: 401 });
    }
    
    const apiKey = authHeader.slice(7);
    const agentRecord = await validateAgent(agentId, apiKey);
    
    if (!agentRecord) {
      return new NextResponse("Invalid agent", { status: 401 });
    }
    
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    
    if (action === "next") {
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
            eq(workSchema.stage, "new"),
            or(
              isNull(workSchema.aiAgentId),
              eq(workSchema.aiAgentId, agentId)
            )
          ))
          .orderBy(workSchema.priority, workSchema.createdAt)
          .limit(1);
        
        if (workItems.length > 0) {
          const workItem = workItems[0];
          
          let nextStage = workItem.stage;
          if (workItem.stage === "new") nextStage = "triaged";
          
          await db.update(workSchema).set({
            aiAgentId: agentId,
            aiStatus: "running",
            aiStartedAt: new Date(),
            ...(nextStage && { stage: nextStage }),
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
      return new NextResponse("Missing auth", { status: 401 });
    }
    
    const apiKey = authHeader.slice(7);
    const agentRecord = await validateAgent(agentId, apiKey);
    
    if (!agentRecord) {
      return new NextResponse("Invalid agent", { status: 401 });
    }
    
    const body = await request.json();
    const { workId, action } = body;
    
    if (action === "stream" && workId) {
      const [workItem] = await db
        .select()
        .from(workSchema)
        .where(eq(workSchema.id, workId))
        .limit(1);
      
      if (!workItem) {
        return new NextResponse("Work not found", { status: 404 });
      }
      
      const typePrompt = WORK_TYPE_PROMPTS[workItem.type as WorkType] || WORK_TYPE_PROMPTS.task;
      
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          const sendEvent = (event: string, data: object) => {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          };
          
          sendEvent("start", { workId, title: workItem.title });
          
          let fullContent = "";
          
          try {
            for await (const chunk of executeWorkStream({
              workId: workItem.id,
              title: workItem.title,
              description: workItem.description,
              instructions: workItem.instructions,
              successCriteria: workItem.successCriteria,
              workType: workItem.type,
              outputFormat: agentRecord.outputFormat || "markdown",
              systemPrompt: agentRecord.config?.systemPrompt || typePrompt,
            })) {
              if (chunk.type === "content" && chunk.content) {
                fullContent += chunk.content;
                sendEvent("chunk", { content: chunk.content });
              } else if (chunk.type === "error") {
                sendEvent("error", { error: chunk.error });
                
                await db.update(workSchema).set({
                  aiStatus: "failed",
                  aiError: chunk.error,
                }).where(eq(workSchema.id, workId));
                
                await db.insert(agentWorkLog).values({
                  id: nanoid(),
                  agentId,
                  workId,
                  action: "ai_failed",
                  message: `AI execution error: ${chunk.error}`,
                });
              } else if (chunk.type === "done") {
                sendEvent("done", { workId });
                
                const [currentWork] = await db
                  .select()
                  .from(workSchema)
                  .where(eq(workSchema.id, workId))
                  .limit(1);
                
                const stageOrder = ["new", "triaged", "in_progress", "awaiting_review", "done"];
                const currentStageIndex = stageOrder.indexOf(currentWork?.stage || "new");
                
                const newStageIndex = Math.min(currentStageIndex + 1, stageOrder.length - 1);
                const newStage = stageOrder[newStageIndex];
                
                const progress: Record<string, { content: string; timestamp: string }> = (currentWork?.aiProgress as Record<string, { content: string; timestamp: string }>) || {};
                progress[newStage] = {
                  content: fullContent,
                  timestamp: new Date().toISOString(),
                };
                
                await db.update(workSchema).set({
                  aiStatus: newStage === "done" ? "completed" : "running",
                  aiCompletedAt: newStage === "done" ? new Date() : null,
                  aiProgress: progress,
                  stage: newStage,
                }).where(eq(workSchema.id, workId));
                
                if (fullContent) {
                  await db.insert(workOutput).values({
                    id: nanoid(),
                    workId,
                    version: 1,
                    content: {
                      markdown: fullContent,
                      model: "anthropic/claude-3-haiku",
                    },
                    contentType: "markdown",
                    submittedBy: agentRecord.ownerId || "system",
                  });
                }
                
                await db.insert(agentWorkLog).values({
                  id: nanoid(),
                  agentId,
                  workId,
                  action: "ai_completed",
                  message: "AI execution completed",
                });
              }
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            sendEvent("error", { error: message });
            
            await db.update(workSchema).set({
              aiStatus: "failed",
              aiError: message,
            }).where(eq(workSchema.id, workId));
          }
          
          controller.close();
        },
      });
      
      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
    
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Agent API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
