"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { user } from "@/db/schema/auth-schema";
import { teamMember } from "@/db/schema/teams";
import { requireUser } from "@/actions/auth/session";
import { eq, and, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export interface StageCount {
  stage: string;
  count: number;
}

export interface TeamAnalytics {
  total: number;
  completed: number;
  cancelled: number;
  active: number;
  completionRate: number;
  avgCycleDays: number | null;
  blocked: number;
  awaitingReview: number;
  inRevision: number;
  byStageCounts: Record<string, number>;
  byTypeCounts: Record<string, number>;
}

export interface MemberWorkload {
  userId: string;
  name: string;
  email: string;
  active: number;
  completed: number;
  awaitingReview: number;
}

const fetchTeamWork = (teamId: string) =>
  unstable_cache(
    () =>
      db
        .select({
          stage: work.stage,
          type: work.type,
          completedAt: work.completedAt,
          createdAt: work.createdAt,
        })
        .from(work)
        .where(eq(work.teamId, teamId)),
    [`team-analytics-${teamId}`],
    { revalidate: 60, tags: [`analytics`, `team-${teamId}`] },
  )();

const fetchUserWork = (userId: string) =>
  unstable_cache(
    () =>
      db
        .select({
          stage: work.stage,
          type: work.type,
          completedAt: work.completedAt,
          createdAt: work.createdAt,
        })
        .from(work)
        .where(eq(work.assignedTo, userId)),
    [`my-analytics-${userId}`],
    { revalidate: 60, tags: [`analytics`, `user-${userId}`] },
  )();

function computeAnalytics(
  allWork: Array<{
    stage: string;
    type: string;
    completedAt: Date | null;
    createdAt: Date;
  }>,
): TeamAnalytics {
  const byStageCounts: Record<string, number> = {};
  const byTypeCounts: Record<string, number> = {};
  let completedCycleDaysSum = 0;
  let completedWithCycle = 0;

  for (const item of allWork) {
    byStageCounts[item.stage] = (byStageCounts[item.stage] ?? 0) + 1;
    byTypeCounts[item.type] = (byTypeCounts[item.type] ?? 0) + 1;
    if (item.stage === "done" && item.completedAt) {
      const days =
        (new Date(item.completedAt).getTime() -
          new Date(item.createdAt).getTime()) /
        86_400_000;
      completedCycleDaysSum += days;
      completedWithCycle++;
    }
  }

  const total = allWork.length;
  const completed = byStageCounts["done"] ?? 0;
  const cancelled = byStageCounts["cancelled"] ?? 0;
  const blocked = byStageCounts["blocked"] ?? 0;
  const awaitingReview = byStageCounts["awaiting_review"] ?? 0;
  const inRevision = byStageCounts["revision"] ?? 0;
  const active = total - completed - cancelled;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const avgCycleDays =
    completedWithCycle > 0
      ? Math.round((completedCycleDaysSum / completedWithCycle) * 10) / 10
      : null;

  return {
    total,
    completed,
    cancelled,
    active,
    completionRate,
    avgCycleDays,
    blocked,
    awaitingReview,
    inRevision,
    byStageCounts,
    byTypeCounts,
  };
}

export async function getTeamAnalytics(teamId: string): Promise<TeamAnalytics> {
  await requireUser();
  const allWork = await fetchTeamWork(teamId);
  return computeAnalytics(allWork);
}

export async function getMyAnalytics(): Promise<TeamAnalytics> {
  const currentUser = await requireUser();
  const allWork = await fetchUserWork(currentUser.id);
  return computeAnalytics(allWork);
}

export async function getTeamMemberWorkloads(
  teamId: string,
): Promise<MemberWorkload[]> {
  await requireUser();

  const members = await db
    .select({
      userId: teamMember.userId,
      name: user.name,
      email: user.email,
    })
    .from(teamMember)
    .innerJoin(user, eq(teamMember.userId, user.id))
    .where(eq(teamMember.teamId, teamId));

  if (members.length === 0) return [];

  const memberIds = members.map((m) => m.userId);

  const workItems = await db
    .select({
      assignedTo: work.assignedTo,
      stage: work.stage,
    })
    .from(work)
    .where(and(eq(work.teamId, teamId), inArray(work.assignedTo, memberIds)));

  return members.map((member) => {
    const memberWork = workItems.filter((w) => w.assignedTo === member.userId);
    return {
      userId: member.userId,
      name: member.name,
      email: member.email,
      active: memberWork.filter((w) => !["done", "cancelled"].includes(w.stage))
        .length,
      completed: memberWork.filter((w) => w.stage === "done").length,
      awaitingReview: memberWork.filter((w) => w.stage === "awaiting_review")
        .length,
    };
  });
}

export async function getVelocityByWeek(
  teamId: string,
): Promise<{ week: string; completed: number }[]> {
  await requireUser();
  const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);
  const completed = await db
    .select({ completedAt: work.completedAt })
    .from(work)
    .where(and(eq(work.teamId, teamId), eq(work.stage, "done")));

  const byWeek: Record<string, number> = {};
  for (const item of completed) {
    if (!item.completedAt || new Date(item.completedAt) < eightWeeksAgo)
      continue;
    const d = new Date(item.completedAt);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    byWeek[key] = (byWeek[key] ?? 0) + 1;
  }

  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, completed]) => ({ week, completed }));
}

export async function getBottleneckStages(
  teamId: string,
): Promise<{ stage: string; avgDays: number; count: number }[]> {
  await requireUser();
  const items = await db
    .select({ stage: work.stage, updatedAt: work.updatedAt })
    .from(work)
    .where(and(eq(work.teamId, teamId)));

  const stageData: Record<string, { total: number; count: number }> = {};
  const activeStages = [
    "triaged",
    "in_progress",
    "awaiting_review",
    "revision",
    "blocked",
  ];
  for (const item of items) {
    if (!activeStages.includes(item.stage)) continue;
    const days = (Date.now() - new Date(item.updatedAt).getTime()) / 86_400_000;
    if (!stageData[item.stage]) stageData[item.stage] = { total: 0, count: 0 };
    stageData[item.stage].total += days;
    stageData[item.stage].count += 1;
  }

  return Object.entries(stageData)
    .map(([stage, d]) => ({
      stage,
      avgDays: Math.round((d.total / d.count) * 10) / 10,
      count: d.count,
    }))
    .sort((a, b) => b.avgDays - a.avgDays);
}

export async function getNavCounts(): Promise<{
  awaitingReview: number;
  blocked: number;
  myWorkCount: number;
}> {
  const currentUser = await requireUser();

  const items = await db
    .select({ stage: work.stage })
    .from(work)
    .where(eq(work.assignedTo, currentUser.id));

  const activeStages = ["new", "triaged", "in_progress", "awaiting_review", "revision", "blocked"];

  return {
    awaitingReview: items.filter((w) => w.stage === "awaiting_review").length,
    blocked: items.filter((w) => w.stage === "blocked").length,
    myWorkCount: items.filter((w) => activeStages.includes(w.stage)).length,
  };
}

export async function getMyVelocityByWeek(): Promise<
  { week: string; completed: number }[]
> {
  const currentUser = await requireUser();
  const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);

  const completed = await db
    .select({ completedAt: work.completedAt })
    .from(work)
    .where(and(eq(work.assignedTo, currentUser.id), eq(work.stage, "done")));

  const byWeek: Record<string, number> = {};
  for (const item of completed) {
    if (!item.completedAt || new Date(item.completedAt) < eightWeeksAgo)
      continue;
    const d = new Date(item.completedAt);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    byWeek[key] = (byWeek[key] ?? 0) + 1;
  }

  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, completed]) => ({ week, completed }));
}

export async function getMyBottleneckStages(): Promise<
  { stage: string; avgDays: number; count: number }[]
> {
  const currentUser = await requireUser();

  const items = await db
    .select({ stage: work.stage, updatedAt: work.updatedAt })
    .from(work)
    .where(eq(work.assignedTo, currentUser.id));

  const stageData: Record<string, { total: number; count: number }> = {};
  const activeStages = [
    "triaged",
    "in_progress",
    "awaiting_review",
    "revision",
    "blocked",
  ];

  for (const item of items) {
    if (!activeStages.includes(item.stage)) continue;
    const days = (Date.now() - new Date(item.updatedAt).getTime()) / 86_400_000;
    if (!stageData[item.stage]) stageData[item.stage] = { total: 0, count: 0 };
    stageData[item.stage].total += days;
    stageData[item.stage].count += 1;
  }

  return Object.entries(stageData)
    .map(([stage, d]) => ({
      stage,
      avgDays: Math.round((d.total / d.count) * 10) / 10,
      count: d.count,
    }))
    .sort((a, b) => b.avgDays - a.avgDays);
}

export interface PersonalWorkloadSummary {
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  avgPerWeek: number;
  streak: number;
}

export async function getMyWorkloadSummary(): Promise<PersonalWorkloadSummary> {
  const currentUser = await requireUser();

  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const allCompleted = await db
    .select({ completedAt: work.completedAt })
    .from(work)
    .where(and(eq(work.assignedTo, currentUser.id), eq(work.stage, "done")));

  let thisWeek = 0;
  let lastWeek = 0;
  let thisMonth = 0;
  let lastMonth = 0;
  let streak = 0;
  let prevWeekCompleted = -1;

  const sortedWeeks: { week: Date; count: number }[] = [];

  for (const item of allCompleted) {
    if (!item.completedAt) continue;
    const d = new Date(item.completedAt);

    if (d >= startOfThisWeek) thisWeek++;
    if (d >= startOfLastWeek && d < startOfThisWeek) lastWeek++;
    if (d >= startOfThisMonth) thisMonth++;
    if (d >= startOfLastMonth && d < startOfThisMonth) lastMonth++;

    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const existing = sortedWeeks.find(
      (w) => w.week.getTime() === monday.getTime(),
    );
    if (existing) {
      existing.count++;
    } else {
      sortedWeeks.push({ week: monday, count: 1 });
    }
  }

  sortedWeeks.sort((a, b) => b.week.getTime() - a.week.getTime());

  for (const week of sortedWeeks) {
    if (prevWeekCompleted === -1) {
      if (week.count > 0) {
        streak = 1;
        prevWeekCompleted = week.count;
      }
    } else {
      if (week.count >= prevWeekCompleted) {
        streak++;
        prevWeekCompleted = week.count;
      } else {
        break;
      }
    }
  }

  const weeksWithWork = sortedWeeks.filter((w) => w.count > 0);
  const avgPerWeek =
    weeksWithWork.length > 0
      ? Math.round(
          (weeksWithWork.reduce((s, w) => s + w.count, 0) /
            weeksWithWork.length) *
            10,
        ) / 10
      : 0;

  return {
    thisWeek,
    lastWeek,
    thisMonth,
    lastMonth,
    avgPerWeek,
    streak,
  };
}
