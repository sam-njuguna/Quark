"use server";

import { db } from "@/db";
import { agent, agentTask, agentWorkLog } from "@/db/schema/agent";
import { requireUser } from "@/actions/auth/session";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function listAgents(teamId?: string) {
  const user = await requireUser();
  const conditions = teamId ? [eq(agent.teamId, teamId)] : [];
  return db.select().from(agent).where(and(...conditions)).orderBy(desc(agent.createdAt));
}

export async function getAgent(agentId: string) {
  await requireUser();
  return db.select().from(agent).where(eq(agent.id, agentId)).limit(1);
}

export async function createAgent(data: {
  name: string;
  description?: string;
  teamId: string;
  agentType?: "mcp" | "webhook" | "api";
  config?: {
    mcpServerUrl?: string;
    webhookUrl?: string;
    apiKey?: string;
    model?: string;
    capabilities?: string[];
  };
  maxConcurrentTasks?: number;
  rateLimit?: number;
}) {
  const user = await requireUser();
  const [created] = await db.insert(agent).values({
    id: nanoid(),
    name: data.name,
    description: data.description,
    teamId: data.teamId,
    ownerId: user.id,
    agentType: data.agentType || "mcp",
    config: data.config || {},
    maxConcurrentTasks: String(data.maxConcurrentTasks || 5),
    rateLimit: String(data.rateLimit || 60),
    isActive: true,
  }).returning();
  return created;
}

export async function updateAgent(agentId: string, data: Partial<{
  name: string;
  description: string;
  isActive: boolean;
  config: Record<string, unknown>;
  maxConcurrentTasks: number;
  rateLimit: number;
}>) {
  const user = await requireUser();
  const updates: Record<string, unknown> = { ...data };
  if (data.maxConcurrentTasks) updates.maxConcurrentTasks = String(data.maxConcurrentTasks);
  if (data.rateLimit) updates.rateLimit = String(data.rateLimit);
  
  const [updated] = await db.update(agent).set(updates).where(eq(agent.id, agentId)).returning();
  return updated;
}

export async function deleteAgent(agentId: string) {
  const user = await requireUser();
  await db.delete(agent).where(eq(agent.id, agentId));
}

export async function getAgentTasks(agentId: string, status?: string, limit = 50) {
  await requireUser();
  const conditions = [eq(agentTask.agentId, agentId)];
  if (status) conditions.push(eq(agentTask.status, status));
  return db.select().from(agentTask).where(and(...conditions)).orderBy(desc(agentTask.createdAt)).limit(limit);
}

export async function createAgentTask(data: {
  agentId: string;
  workId?: string;
  title: string;
  description?: string;
  instructions?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}) {
  const [created] = await db.insert(agentTask).values({
    id: nanoid(),
    agentId: data.agentId,
    workId: data.workId,
    title: data.title,
    description: data.description,
    instructions: data.instructions,
    priority: data.priority || "normal",
    status: "pending",
    retryCount: "0",
    maxRetries: "3",
  }).returning();
  return created;
}

export async function assignTaskToAgent(agentId: string, taskId: string) {
  const [updated] = await db.update(agentTask).set({
    status: "assigned",
    assignedAt: new Date(),
  }).where(eq(agentTask.id, taskId)).returning();
  return updated;
}

export async function startTask(taskId: string) {
  const [updated] = await db.update(agentTask).set({
    status: "in_progress",
    startedAt: new Date(),
  }).where(eq(agentTask.id, taskId)).returning();
  return updated;
}

export async function completeTask(taskId: string, result: Record<string, unknown>) {
  const [updated] = await db.update(agentTask).set({
    status: "completed",
    completedAt: new Date(),
    result,
  }).where(eq(agentTask.id, taskId)).returning();
  return updated;
}

export async function failTask(taskId: string, error: string) {
  const task = await db.select().from(agentTask).where(eq(agentTask.id, taskId)).limit(1);
  const retryCount = parseInt(task[0]?.retryCount || "0");
  const maxRetries = parseInt(task[0]?.maxRetries || "3");
  
  if (retryCount < maxRetries) {
    await db.update(agentTask).set({
      status: "pending",
      retryCount: String(retryCount + 1),
      error,
    }).where(eq(agentTask.id, taskId));
  } else {
    await db.update(agentTask).set({
      status: "failed",
      error,
    }).where(eq(agentTask.id, taskId));
  }
}

export async function logAgentWork(data: {
  agentId: string;
  taskId?: string;
  workId?: string;
  action: string;
  message?: string;
  metadata?: Record<string, unknown>;
  duration?: number;
}) {
  await db.insert(agentWorkLog).values({
    id: nanoid(),
    agentId: data.agentId,
    taskId: data.taskId,
    workId: data.workId,
    action: data.action,
    message: data.message,
    metadata: data.metadata,
    duration: data.duration ? String(data.duration) : null,
  });
}

export async function getAgentWorkLogs(agentId: string, taskId?: string, limit = 100) {
  await requireUser();
  const conditions = [eq(agentWorkLog.agentId, agentId)];
  if (taskId) conditions.push(eq(agentWorkLog.taskId, taskId));
  return db.select().from(agentWorkLog).where(and(...conditions)).orderBy(desc(agentWorkLog.createdAt)).limit(limit);
}

export async function getAgentStats(agentId: string) {
  const tasks = await db.select().from(agentTask).where(eq(agentTask.agentId, agentId));
  const logs = await db.select().from(agentWorkLog).where(eq(agentWorkLog.agentId, agentId));
  
  const pending = tasks.filter(t => t.status === "pending").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const failed = tasks.filter(t => t.status === "failed").length;
  
  return {
    totalTasks: tasks.length,
    pending,
    inProgress,
    completed,
    failed,
    totalLogs: logs.length,
  };
}

export async function getNextTask(agentId: string) {
  const [task] = await db
    .select()
    .from(agentTask)
    .where(and(
      eq(agentTask.agentId, agentId),
      eq(agentTask.status, "pending")
    ))
    .orderBy(agentTask.createdAt)
    .limit(1);
  return task || null;
}
