"use server";

import { db } from "@/db";
import { work, workOutput } from "@/db/schema/work";
import { agent } from "@/db/schema/agent";
import { eq, desc, and, or, isNotNull } from "drizzle-orm";
import { requireUser } from "@/actions/auth/session";

export async function getAIActiveWork(teamId?: string) {
  await requireUser();

  const conditions = [
    or(
      eq(work.aiStatus, "running"),
      eq(work.aiStatus, "assigned")
    ),
    isNotNull(work.aiAgentId),
  ];

  if (teamId) {
    conditions.push(eq(work.teamId, teamId));
  }

  const aiWork = await db
    .select()
    .from(work)
    .where(and(...conditions))
    .orderBy(desc(work.aiStartedAt))
    .limit(10);

  return aiWork;
}

export async function getAIRecentCompleted(teamId?: string) {
  await requireUser();

  const conditions = [
    eq(work.aiStatus, "completed"),
    isNotNull(work.aiAgentId),
  ];

  if (teamId) {
    conditions.push(eq(work.teamId, teamId));
  }

  const completedWork = await db
    .select({
      id: work.id,
      title: work.title,
      type: work.type,
      stage: work.stage,
      aiCompletedAt: work.aiCompletedAt,
    })
    .from(work)
    .where(and(...conditions))
    .orderBy(desc(work.aiCompletedAt))
    .limit(5);

  return completedWork;
}

export async function getAIStats(teamId?: string) {
  await requireUser();

  const baseCondition = teamId ? eq(work.teamId, teamId) : undefined;

  const [running, completed, failed] = await Promise.all([
    db
      .select({ count: work.id })
      .from(work)
      .where(and(
        eq(work.aiStatus, "running"),
        ...(baseCondition ? [baseCondition] : [])
      )),
    db
      .select({ count: work.id })
      .from(work)
      .where(and(
        eq(work.aiStatus, "completed"),
        ...(baseCondition ? [baseCondition] : [])
      )),
    db
      .select({ count: work.id })
      .from(work)
      .where(and(
        eq(work.aiStatus, "failed"),
        ...(baseCondition ? [baseCondition] : [])
      )),
  ]);

  return {
    running: running[0]?.count || 0,
    completed: completed[0]?.count || 0,
    failed: failed[0]?.count || 0,
  };
}
