"use server";

import { db } from "@/db";
import { recurringWork } from "@/db/schema/recurring-work";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { addDays, addMonths, startOfTomorrow } from "date-fns";

function computeNextRun(
  pattern: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
): Date {
  const now = new Date();
  if (pattern === "daily") return addDays(startOfTomorrow(), 0);
  if (pattern === "weekly") {
    let next = addDays(now, 1);
    while (next.getDay() !== (dayOfWeek ?? 1)) next = addDays(next, 1);
    return next;
  }
  if (pattern === "monthly") {
    const next = addMonths(now, 1);
    next.setDate(Math.min(dayOfMonth ?? 1, 28));
    return next;
  }
  return addDays(now, 1);
}

export async function listRecurringWork(teamId: string) {
  await requireUser();
  return db
    .select()
    .from(recurringWork)
    .where(eq(recurringWork.teamId, teamId));
}

export async function createRecurringWork(input: {
  teamId: string;
  pattern: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  templateTitle: string;
  templateType: string;
  templateDescription?: string;
  templateInstructions?: string;
  templatePriority?: number;
  templateSuccessCriteria?: string[];
}) {
  const user = await requireUser();

  const nextRunAt = computeNextRun(
    input.pattern,
    input.dayOfWeek,
    input.dayOfMonth,
  );

  const [created] = await db
    .insert(recurringWork)
    .values({
      id: nanoid(),
      teamId: input.teamId,
      createdBy: user.id,
      pattern: input.pattern,
      dayOfWeek: input.dayOfWeek,
      dayOfMonth: input.dayOfMonth,
      templateTitle: input.templateTitle,
      templateType: input.templateType,
      templateDescription: input.templateDescription,
      templateInstructions: input.templateInstructions,
      templatePriority: input.templatePriority ?? 2,
      templateSuccessCriteria: input.templateSuccessCriteria,
      nextRunAt,
      isActive: true,
    })
    .returning();

  return created;
}

export async function deleteRecurringWork(id: string) {
  const user = await requireUser();
  const [rw] = await db
    .select()
    .from(recurringWork)
    .where(eq(recurringWork.id, id));
  if (!rw || rw.createdBy !== user.id)
    throw new Error("Not found or unauthorized");
  await db.delete(recurringWork).where(eq(recurringWork.id, id));
}

export async function toggleRecurringWork(id: string, isActive: boolean) {
  await requireUser();
  await db
    .update(recurringWork)
    .set({ isActive })
    .where(eq(recurringWork.id, id));
}
