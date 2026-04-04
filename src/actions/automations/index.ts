"use server";

import { db } from "@/db";
import { stageAutomation } from "@/db/schema/stage-automations";
import { work } from "@/db/schema/work";
import { requireUser, getUserTeams } from "@/actions/auth/session";
import { eq, and, lt, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { analyzeWork, suggestNextSteps } from "@/lib/ai-triage";

export async function listAutomations(teamId: string) {
  await requireUser();
  return db.select().from(stageAutomation).where(eq(stageAutomation.teamId, teamId));
}

export async function createAutomation(
  teamId: string,
  data: { name: string; triggerStage: string; action: string; actionConfig?: Record<string, unknown> },
) {
  const user = await requireUser();
  const [created] = await db
    .insert(stageAutomation)
    .values({ id: nanoid(), teamId, createdBy: user.id, ...data, isActive: true })
    .returning();
  return created;
}

export async function deleteAutomation(id: string) {
  const user = await requireUser();
  const teams = await getUserTeams(user.id);
  const [auto] = await db.select().from(stageAutomation).where(eq(stageAutomation.id, id));
  if (!auto || !teams.find((t) => t.id === auto.teamId)) throw new Error("Not found");
  await db.delete(stageAutomation).where(eq(stageAutomation.id, id));
}

export async function toggleAutomation(id: string, isActive: boolean) {
  await requireUser();
  await db.update(stageAutomation).set({ isActive }).where(eq(stageAutomation.id, id));
}

// Phase 3 helpers exposed as server actions

export async function getSlaAlerts() {
  await requireUser();
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(work)
    .where(
      and(
        lte(work.dueDate, threeDaysFromNow),
        eq(work.stage, "in_progress"),
      ),
    );
}

export async function getAnomalies() {
  await requireUser();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(work)
    .where(
      and(
        lt(work.updatedAt, sevenDaysAgo),
        eq(work.stage, "in_progress"),
      ),
    );
}

export async function archiveOldWork() {
  await requireUser();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await db
    .update(work)
    .set({ stage: "cancelled" })
    .where(and(eq(work.stage, "done"), lt(work.completedAt, cutoff)))
    .returning({ id: work.id });
  return { archived: result.length };
}

export async function predictPriority(title: string, description?: string): Promise<number> {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  const highKeywords = ["urgent", "critical", "asap", "blocker", "broken", "down", "emergency", "immediately", "p1"];
  const lowKeywords = ["nice to have", "eventually", "someday", "low priority", "backlog", "p3", "minor"];
  if (highKeywords.some((k) => text.includes(k))) return 1;
  if (lowKeywords.some((k) => text.includes(k))) return 3;
  return 2;
}

export async function aiPredictPriority(title: string, description?: string): Promise<{ priority: number; confidence: number; reasoning: string }> {
  const analysis = await analyzeWork(title, description ?? null);
  return {
    priority: analysis.suggestedPriority,
    confidence: analysis.confidence,
    reasoning: analysis.reasoning,
  };
}

export async function aiSuggestType(title: string, description?: string): Promise<{ type: string; confidence: number }> {
  const analysis = await analyzeWork(title, description ?? null);
  return {
    type: analysis.suggestedType,
    confidence: analysis.confidence,
  };
}

export async function aiSuggestStage(title: string, description?: string): Promise<{ stage: string; confidence: number }> {
  const analysis = await analyzeWork(title, description ?? null);
  return {
    stage: analysis.suggestedStage,
    confidence: analysis.confidence,
  };
}

export async function aiGetNextSteps(workId: string): Promise<string[]> {
  return suggestNextSteps(workId);
}
