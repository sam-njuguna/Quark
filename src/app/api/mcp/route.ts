import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { work as workSchema, workOutput } from "@/db/schema/work";
import { team } from "@/db/schema/teams";
import { agent } from "@/db/schema/agent";
import { eq, and, desc, or, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

// MCP Methods
const MCP_METHODS = {
  // Work item methods
  "work.list": listWork,
  "work.get": getWork,
  "work.create": createWork,
  "work.update": updateWork,
  "work.updateStage": updateWorkStage,
  "work.submit": submitWorkOutput,
  
  // Agent methods
  "agent.list": listAgents,
  "agent.get": getAgent,
  "agent.next": getNextWork,
  
  // Team methods
  "team.list": listTeams,
  "team.get": getTeam,
};

interface MCPRequest {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
  id: string | number;
}

interface MCPResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number;
}

async function validateApiKey(apiKey: string) {
  if (!apiKey) return null;
  
  const [agentRecord] = await db
    .select()
    .from(agent)
    .where(and(eq(agent.isActive, true)))
    .limit(1);
  
  if (!agentRecord) return null;
  
  const validKey = agentRecord.config?.apiKey === apiKey;
  if (!validKey) return null;
  
  return agentRecord;
}

async function listWork(params: Record<string, unknown>) {
  const { 
    teamId, 
    stage, 
    assignedTo, 
    type, 
    limit = 20,
    offset = 0 
  } = params;
  
  const conditions = [];
  
  if (teamId) conditions.push(eq(workSchema.teamId, teamId as string));
  if (stage) conditions.push(eq(workSchema.stage, stage as string));
  if (assignedTo) conditions.push(eq(workSchema.assignedTo, assignedTo as string));
  if (type) conditions.push(eq(workSchema.type, type as string));
  
  const workItems = await db
    .select()
    .from(workSchema)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(workSchema.createdAt))
    .limit(limit as number)
    .offset(offset as number);
  
  return workItems.map(w => ({
    id: w.id,
    title: w.title,
    type: w.type,
    stage: w.stage,
    description: w.description,
    instructions: w.instructions,
    priority: w.priority,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }));
}

async function getWork(params: Record<string, unknown>) {
  const { workId } = params;
  
  if (!workId) {
    throw new Error("workId is required");
  }
  
  const [workItem] = await db
    .select()
    .from(workSchema)
    .where(eq(workSchema.id, workId as string))
    .limit(1);
  
  if (!workItem) {
    throw new Error("Work not found");
  }
  
  // Get outputs
  const outputs = await db
    .select()
    .from(workOutput)
    .where(eq(workOutput.workId, workId as string))
    .orderBy(desc(workOutput.version));
  
  return {
    id: workItem.id,
    title: workItem.title,
    type: workItem.type,
    stage: workItem.stage,
    description: workItem.description,
    instructions: workItem.instructions,
    successCriteria: workItem.successCriteria,
    priority: workItem.priority,
    aiStatus: workItem.aiStatus,
    aiProgress: workItem.aiProgress,
    createdAt: workItem.createdAt,
    updatedAt: workItem.updatedAt,
    outputs: outputs.map(o => ({
      id: o.id,
      version: o.version,
      content: o.content,
      contentType: o.contentType,
      createdAt: o.createdAt,
    })),
  };
}

async function createWork(params: Record<string, unknown>) {
  const { 
    title, 
    type = "task", 
    description, 
    instructions, 
    teamId, 
    assignedTo,
    priority = 2,
    successCriteria,
  } = params;
  
  if (!title) {
    throw new Error("title is required");
  }
  
  const id = nanoid();
  
  await db.insert(workSchema).values({
    id,
    title: title as string,
    type: type as string,
    description: description as string | undefined,
    instructions: instructions as string | undefined,
    teamId: teamId as string | undefined,
    assignedTo: assignedTo as string | undefined,
    priority: priority as number,
    successCriteria: successCriteria as string[] | undefined,
    stage: "new",
    createdBy: "agent_created",
  });
  
  return { id, title };
}

async function updateWork(params: Record<string, unknown>) {
  const { workId, ...updates } = params;
  
  if (!workId) {
    throw new Error("workId is required");
  }
  
  const allowedFields = [
    "title", "description", "instructions", "priority", 
    "assignedTo", "stage", "successCriteria"
  ];
  
  const setClause: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClause[field] = updates[field];
    }
  }
  
  setClause.updatedAt = new Date();
  
  await db.update(workSchema).set(setClause).where(eq(workSchema.id, workId as string));
  
  return { success: true, workId };
}

async function updateWorkStage(params: Record<string, unknown>) {
  const { workId, stage, reason } = params;
  
  if (!workId || !stage) {
    throw new Error("workId and stage are required");
  }
  
  const updateData: Record<string, unknown> = {
    stage: stage as string,
    updatedAt: new Date(),
  };
  
  if (stage === "done") {
    updateData.completedAt = new Date();
  }
  if (stage === "blocked" && reason) {
    updateData.blockedReason = reason as string;
  }
  
  await db.update(workSchema).set(updateData).where(eq(workSchema.id, workId as string));
  
  return { success: true, workId, stage };
}

async function submitWorkOutput(params: Record<string, unknown>) {
  const { workId, content, contentType = "markdown" } = params;
  
  if (!workId || !content) {
    throw new Error("workId and content are required");
  }
  
  // Get latest version
  const [latest] = await db
    .select()
    .from(workOutput)
    .where(eq(workOutput.workId, workId as string))
    .orderBy(desc(workOutput.version))
    .limit(1);
  
  const newVersion = latest ? latest.version + 1 : 1;
  
  const outputId = nanoid();
  await db.insert(workOutput).values({
    id: outputId,
    workId: workId as string,
    version: newVersion,
    content: content as Record<string, unknown>,
    contentType: contentType as string,
    submittedBy: "agent_submitted",
  });
  
  // Update work stage to awaiting_review if not already done
  const [workItem] = await db
    .select()
    .from(workSchema)
    .where(eq(workSchema.id, workId as string))
    .limit(1);
  
  if (workItem && workItem.stage !== "done") {
    await db.update(workSchema)
      .set({ stage: "awaiting_review", updatedAt: new Date() })
      .where(eq(workSchema.id, workId as string));
  }
  
  return { success: true, outputId, version: newVersion };
}

async function listAgents(params: Record<string, unknown>) {
  const { teamId, isActive, limit = 20 } = params;
  
  const conditions = [];
  if (teamId) conditions.push(eq(agent.teamId, teamId as string));
  if (isActive !== undefined) conditions.push(eq(agent.isActive, isActive as boolean));
  
  const agents = await db
    .select()
    .from(agent)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit as number);
  
  return agents.map(a => ({
    id: a.id,
    name: a.name,
    agentType: a.agentType,
    isActive: a.isActive,
    workTypes: a.workTypes,
    createdAt: a.createdAt,
  }));
}

async function getAgent(params: Record<string, unknown>) {
  const { agentId } = params;
  
  if (!agentId) {
    throw new Error("agentId is required");
  }
  
  const [agentRecord] = await db
    .select()
    .from(agent)
    .where(eq(agent.id, agentId as string))
    .limit(1);
  
  if (!agentRecord) {
    throw new Error("Agent not found");
  }
  
  return {
    id: agentRecord.id,
    name: agentRecord.name,
    agentType: agentRecord.agentType,
    isActive: agentRecord.isActive,
    workTypes: agentRecord.workTypes,
    config: agentRecord.config,
    createdAt: agentRecord.createdAt,
  };
}

async function getNextWork(params: Record<string, unknown>) {
  const { agentId } = params;
  
  if (!agentId) {
    throw new Error("agentId is required");
  }
  
  const [agentRecord] = await db
    .select()
    .from(agent)
    .where(eq(agent.id, agentId as string))
    .limit(1);
  
  if (!agentRecord) {
    throw new Error("Agent not found");
  }
  
  const agentIdStr = agentId as string;
  
  // Find next work in same team
  const [workItem] = await db
    .select()
    .from(workSchema)
    .where(and(
      eq(workSchema.teamId, agentRecord.teamId!),
      eq(workSchema.stage, "new"),
      or(
        isNull(workSchema.aiAgentId),
        eq(workSchema.aiAgentId, agentIdStr)
      )
    ))
    .orderBy(workSchema.priority, workSchema.createdAt)
    .limit(1);
  
  if (!workItem) {
    return null;
  }
  
  // Assign to agent
  await db.update(workSchema).set({
    aiAgentId: agentIdStr,
    aiStatus: "assigned",
    stage: "triaged",
  }).where(eq(workSchema.id, workItem.id));
  
  return {
    id: workItem.id,
    title: workItem.title,
    type: workItem.type,
    description: workItem.description,
    instructions: workItem.instructions,
  };
}

async function listTeams(params: Record<string, unknown>) {
  const { limit = 20 } = params;
  
  const teams = await db
    .select()
    .from(team)
    .limit(limit as number);
  
  return teams.map(t => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
  }));
}

async function getTeam(params: Record<string, unknown>) {
  const teamIdVal = params.teamId as string;
  
  if (!teamIdVal) {
    throw new Error("teamId is required");
  }
  
  const [teamRecord] = await db
    .select()
    .from(team)
    .where(eq(team.id, teamIdVal))
    .limit(1);
  
  if (!teamRecord) {
    throw new Error("Team not found");
  }
  
  return {
    id: teamRecord.id,
    name: teamRecord.name,
    slug: teamRecord.slug,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: MCPRequest = await request.json();
    
    const { method, params, id } = body;
    
    if (!method || !MCP_METHODS[method as keyof typeof MCP_METHODS]) {
      return NextResponse.json({
        jsonrpc: "2.0",
        error: {
          code: -32601,
          message: "Method not found",
        },
        id,
      } as MCPResponse, { status: 400 });
    }
    
    const handler = MCP_METHODS[method as keyof typeof MCP_METHODS];
    
    try {
      const result = await handler(params || {});
      
      return NextResponse.json({
        jsonrpc: "2.0",
        result,
        id,
      } as MCPResponse);
    } catch (error) {
      return NextResponse.json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : "Internal error",
        },
        id,
      } as MCPResponse, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      jsonrpc: "2.0",
      error: {
        code: -32600,
        message: "Invalid Request",
      },
      id: 0,
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Quark MCP Server",
    version: "1.0.0",
    methods: Object.keys(MCP_METHODS),
  });
}
