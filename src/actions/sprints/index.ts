"use server";

import { db } from "@/db";
import { sprint, sprintWork, work } from "@/db/schema";
import { requireUser } from "@/actions/auth/session";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { getSystemRole } from "@/actions/auth/session";
import { teamMember } from "@/db/schema/teams";

export async function getTeamSprints(teamId: string) {
  await requireUser();

  const sprints = await db
    .select()
    .from(sprint)
    .where(eq(sprint.teamId, teamId))
    .orderBy(sprint.startDate);

  return sprints;
}

export async function getActiveSprint(teamId: string) {
  await requireUser();

  const [active] = await db
    .select()
    .from(sprint)
    .where(and(eq(sprint.teamId, teamId), eq(sprint.status, "active")));

  return active || null;
}

export async function getSprintWorkItems(sprintId: string) {
  await requireUser();

  const items = await db
    .select({
      id: work.id,
      title: work.title,
      type: work.type,
      stage: work.stage,
      priority: work.priority,
      assignedTo: work.assignedTo,
      createdAt: work.createdAt,
      completedAt: work.completedAt,
    })
    .from(sprintWork)
    .innerJoin(work, eq(work.id, sprintWork.workId))
    .where(eq(sprintWork.sprintId, sprintId));

  return items;
}

export async function createSprint(data: {
  name: string;
  teamId: string;
  startDate: Date;
  endDate: Date;
  goal?: string;
}) {
  const user = await requireUser();

  const systemRole = await getSystemRole(user.id);
  if (systemRole !== "super_admin") {
    // Check team membership role
    const [membership] = await db
      .select({ role: teamMember.role })
      .from(teamMember)
      .where(
        and(eq(teamMember.userId, user.id), eq(teamMember.teamId, data.teamId)),
      )
      .limit(1);
    const role = membership?.role ?? "member";
    if (!(["admin", "lead"] as string[]).includes(role)) {
      throw new Error("Only admins and leads can create sprints");
    }
  }

  const id = nanoid();
  await db.insert(sprint).values({
    id,
    name: data.name,
    teamId: data.teamId,
    createdBy: user.id,
    startDate: data.startDate,
    endDate: data.endDate,
    goal: data.goal,
    status: "planning",
  });

  return id;
}

export async function updateSprint(
  sprintId: string,
  data: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    goal?: string;
    status?: "planning" | "active" | "completed";
  },
) {
  await requireUser();

  await db.update(sprint).set(data).where(eq(sprint.id, sprintId));

  revalidatePath("/dashboard/team");
}

export async function startSprint(sprintId: string) {
  await requireUser();

  const [sprintData] = await db
    .select()
    .from(sprint)
    .where(eq(sprint.id, sprintId));

  if (!sprintData) throw new Error("Sprint not found");

  await db
    .update(sprint)
    .set({ status: "active" })
    .where(eq(sprint.id, sprintId));

  revalidatePath("/dashboard/team");
}

export async function completeSprint(sprintId: string) {
  await requireUser();

  await db
    .update(sprint)
    .set({ status: "completed" })
    .where(eq(sprint.id, sprintId));

  revalidatePath("/dashboard/team");
}

export async function deleteSprint(sprintId: string) {
  await requireUser();

  await db.delete(sprint).where(eq(sprint.id, sprintId));

  revalidatePath("/dashboard/team");
}

export async function addWorkToSprint(sprintId: string, workId: string) {
  await requireUser();

  const existing = await db
    .select()
    .from(sprintWork)
    .where(
      and(eq(sprintWork.sprintId, sprintId), eq(sprintWork.workId, workId)),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Work item is already in this sprint");
  }

  await db.insert(sprintWork).values({
    id: nanoid(),
    sprintId,
    workId,
  });

  revalidatePath("/dashboard/team");
}

export async function removeWorkFromSprint(sprintId: string, workId: string) {
  await requireUser();

  await db
    .delete(sprintWork)
    .where(
      and(eq(sprintWork.sprintId, sprintId), eq(sprintWork.workId, workId)),
    );

  revalidatePath("/dashboard/team");
}

export async function getSprintBurndown(
  sprintId: string,
): Promise<{ date: string; remaining: number; ideal: number }[]> {
  await requireUser();

  const [sprintData] = await db
    .select()
    .from(sprint)
    .where(eq(sprint.id, sprintId));

  if (!sprintData) throw new Error("Sprint not found");

  const workItems = await getSprintWorkItems(sprintId);
  const totalItems = workItems.length;

  if (totalItems === 0) {
    return [];
  }

  const startDate = new Date(sprintData.startDate);
  const endDate = new Date(sprintData.endDate);
  const today = new Date();

  const completedItems = workItems.filter((w) => {
    if (!w.completedAt) return false;
    const completedDate = new Date(w.completedAt);
    return completedDate <= today;
  }).length;

  const burndown: { date: string; remaining: number; ideal: number }[] = [];
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const idealPerDay = totalItems / totalDays;

  for (
    let currentDate = new Date(startDate), dayIndex = 0;
    currentDate <= today && currentDate <= endDate;
    currentDate.setDate(currentDate.getDate() + 1), dayIndex++
  ) {
    const dayOffset = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const idealRemaining = Math.max(0, totalItems - idealPerDay * dayOffset);

    if (currentDate < today) {
      const completedByDay = workItems.filter((w) => {
        if (!w.completedAt) return false;
        const completedDate = new Date(w.completedAt);
        return completedDate <= currentDate;
      }).length;

      burndown.push({
        date: currentDate.toISOString().split("T")[0],
        remaining: totalItems - completedByDay,
        ideal: Math.round(idealRemaining * 10) / 10,
      });
    }
  }

  if (today <= endDate) {
    const daysSinceStart = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    burndown.push({
      date: today.toISOString().split("T")[0],
      remaining: totalItems - completedItems,
      ideal: Math.max(
        0,
        Math.round((totalItems - idealPerDay * daysSinceStart) * 10) / 10,
      ),
    });
  }

  return burndown;
}

export async function getSprintStats(sprintId: string) {
  await requireUser();

  const workItems = await getSprintWorkItems(sprintId);

  const total = workItems.length;
  const completed = workItems.filter((w) => w.stage === "done").length;
  const cancelled = workItems.filter((w) => w.stage === "cancelled").length;
  const inProgress = workItems.filter((w) =>
    [
      "triaged",
      "in_progress",
      "awaiting_review",
      "revision",
      "blocked",
    ].includes(w.stage),
  ).length;

  const [sprintData] = await db
    .select()
    .from(sprint)
    .where(eq(sprint.id, sprintId));

  let daysRemaining = 0;
  let isOverdue = false;

  if (sprintData && sprintData.status === "active") {
    const endDate = new Date(sprintData.endDate);
    const today = new Date();
    daysRemaining = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    isOverdue = daysRemaining < 0;
  }

  return {
    total,
    completed,
    cancelled,
    inProgress,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    daysRemaining,
    isOverdue,
  };
}

export async function getSprintDetails(sprintId: string) {
  await requireUser();

  const [sprintData] = await db
    .select()
    .from(sprint)
    .where(eq(sprint.id, sprintId));

  if (!sprintData) {
    throw new Error("Sprint not found");
  }

  const [workItems, stats, burndown] = await Promise.all([
    getSprintWorkItems(sprintId),
    getSprintStats(sprintId),
    getSprintBurndown(sprintId),
  ]);

  return {
    sprint: sprintData,
    workItems,
    stats,
    burndown,
  };
}
