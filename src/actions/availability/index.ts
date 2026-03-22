"use server";

import { db } from "@/db";
import {
  userAvailability,
  defaultWeeklySchedule,
} from "@/db/schema/availability";
import { teamMember } from "@/db/schema/teams";
import { user } from "@/db/schema/auth-schema";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import type { WeeklySchedule } from "@/db/schema/availability";

export type AvailabilityStatus =
  | "available"
  | "busy"
  | "away"
  | "dnd"
  | "offline";

export async function getMyAvailability() {
  const currentUser = await requireUser();

  const [row] = await db
    .select()
    .from(userAvailability)
    .where(eq(userAvailability.userId, currentUser.id))
    .limit(1);

  if (!row) {
    return {
      id: null,
      userId: currentUser.id,
      status: "available" as AvailabilityStatus,
      statusNote: null,
      timezone: "UTC",
      weeklySchedule: defaultWeeklySchedule,
      showAvailability: true,
    };
  }

  return {
    ...row,
    status: row.status as AvailabilityStatus,
    weeklySchedule:
      (row.weeklySchedule as WeeklySchedule) ?? defaultWeeklySchedule,
  };
}

export async function setMyAvailability(data: {
  status?: AvailabilityStatus;
  statusNote?: string | null;
  timezone?: string;
  weeklySchedule?: WeeklySchedule;
  showAvailability?: boolean;
}) {
  const currentUser = await requireUser();

  const [existing] = await db
    .select({ id: userAvailability.id })
    .from(userAvailability)
    .where(eq(userAvailability.userId, currentUser.id))
    .limit(1);

  if (existing) {
    await db
      .update(userAvailability)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userAvailability.id, existing.id));
  } else {
    await db.insert(userAvailability).values({
      id: nanoid(),
      userId: currentUser.id,
      status: data.status ?? "available",
      statusNote: data.statusNote ?? null,
      timezone: data.timezone ?? "UTC",
      weeklySchedule: data.weeklySchedule ?? defaultWeeklySchedule,
      showAvailability: data.showAvailability ?? true,
    });
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/calendar");
}

export async function getTeamMembersAvailability(teamId: string) {
  await requireUser();

  const members = await db
    .select({
      userId: teamMember.userId,
      role: teamMember.role,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(teamMember)
    .leftJoin(user, eq(teamMember.userId, user.id))
    .where(eq(teamMember.teamId, teamId));

  // Fetch all availability for team members
  const allAvailability =
    members.length > 0 ? await db.select().from(userAvailability) : [];

  const availMap = new Map(allAvailability.map((a) => [a.userId, a]));

  return members
    .filter((m) => m.userId)
    .map((m) => {
      const avail = availMap.get(m.userId);
      return {
        userId: m.userId,
        name: m.userName ?? m.userEmail ?? "Unknown",
        email: m.userEmail ?? "",
        image: m.userImage ?? null,
        role: m.role,
        status: (avail?.status ?? "offline") as AvailabilityStatus,
        statusNote: avail?.statusNote ?? null,
        showAvailability: avail?.showAvailability ?? false,
        timezone: avail?.timezone ?? "UTC",
        weeklySchedule: (avail?.weeklySchedule as WeeklySchedule) ?? null,
      };
    });
}
