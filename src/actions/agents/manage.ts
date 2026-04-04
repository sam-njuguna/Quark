"use server";

import { db } from "@/db";
import { agent, agentTask, agentWorkLog } from "@/db/schema/agent";
import { requireUser } from "@/actions/auth/session";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function listTeamAgents(teamId?: string) {
  await requireUser();
  const conditions = teamId ? [eq(agent.teamId, teamId)] : [];
  return db.select().from(agent).where(and(...conditions)).orderBy(desc(agent.createdAt));
}

export async function getSingleAgent(agentId: string) {
  await requireUser();
  const [result] = await db.select().from(agent).where(eq(agent.id, agentId)).limit(1);
  return result || null;
}

export async function createTeamAgent(data: {
  name: string;
  description?: string;
  teamId: string;
  agentType?: "mcp" | "webhook" | "api";
  config?: Record<string, unknown>;
  maxConcurrentTasks?: number;
  rateLimit?: number;
}) {
  const user = await requireUser();
  
  const apiKey = `ak_${nanoid(32)}`;
  
  const [created] = await db.insert(agent).values({
    id: nanoid(),
    name: data.name,
    description: data.description,
    teamId: data.teamId,
    ownerId: user.id,
    agentType: data.agentType || "api",
    config: { ...data.config, apiKey },
    maxConcurrentTasks: String(data.maxConcurrentTasks || 5),
    rateLimit: String(data.rateLimit || 60),
    isActive: true,
  }).returning();
  
  return { ...created, apiKey };
}

export async function updateTeamAgent(agentId: string, data: {
  name?: string;
  description?: string;
  isActive?: boolean;
  maxConcurrentTasks?: number;
  rateLimit?: number;
}) {
  await requireUser();
  const updates: Record<string, unknown> = { ...data };
  if (data.maxConcurrentTasks) updates.maxConcurrentTasks = String(data.maxConcurrentTasks);
  if (data.rateLimit) updates.rateLimit = String(data.rateLimit);
  
  const [updated] = await db.update(agent).set(updates).where(eq(agent.id, agentId)).returning();
  return updated;
}

export async function removeAgent(agentId: string) {
  await requireUser();
  await db.delete(agent).where(eq(agent.id, agentId));
}

export async function getAgentTasks(agentId: string, status?: string) {
  await requireUser();
  const conditions = [eq(agentTask.agentId, agentId)];
  if (status) conditions.push(eq(agentTask.status, status));
  return db.select().from(agentTask).where(and(...conditions)).orderBy(desc(agentTask.createdAt)).limit(50);
}

export async function createAgentTask(data: {
  agentId: string;
  workId?: string;
  title: string;
  description?: string;
  instructions?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}) {
  const user = await requireUser();
  
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

export async function assignWorkToTask(taskId: string, workId: string) {
  const [updated] = await db.update(agentTask).set({
    workId,
    status: "assigned",
    assignedAt: new Date(),
  }).where(eq(agentTask.id, taskId)).returning();
  
  return updated;
}

export async function getAgentLogs(agentId: string, taskId?: string) {
  await requireUser();
  const conditions = [eq(agentWorkLog.agentId, agentId)];
  if (taskId) conditions.push(eq(agentWorkLog.taskId, taskId));
  return db.select().from(agentWorkLog).where(and(...conditions)).orderBy(desc(agentWorkLog.createdAt)).limit(100);
}

export async function getAgentStatistics(agentId: string) {
  await requireUser();
  const tasks = await db.select().from(agentTask).where(eq(agentTask.agentId, agentId));
  const logs = await db.select().from(agentWorkLog).where(eq(agentWorkLog.agentId, agentId));
  
  return {
    totalTasks: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    assigned: tasks.filter(t => t.status === "assigned").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
    failed: tasks.filter(t => t.status === "failed").length,
    totalLogs: logs.length,
  };
}
