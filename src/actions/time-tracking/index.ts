"use server";

import { db } from "@/db";
import { timeLog } from "@/db/schema/time-tracking";
import { requireUser } from "@/actions/auth/session";
import { eq, and, desc, sum } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const startSchema = z.object({
  workId: z.string().min(1),
  note: z.string().optional(),
});

const stopSchema = z.object({
  logId: z.string().min(1),
  note: z.string().optional(),
});

const manualSchema = z.object({
  workId: z.string().min(1),
  startedAt: z.string(),
  endedAt: z.string(),
  note: z.string().optional(),
});

export async function startTimer(data: z.infer<typeof startSchema>) {
  const user = await requireUser();
  const validated = startSchema.parse(data);

  const [log] = await db
    .insert(timeLog)
    .values({
      id: nanoid(),
      workId: validated.workId,
      userId: user.id,
      startedAt: new Date(),
      note: validated.note ?? null,
    })
    .returning();

  revalidatePath(`/dashboard/work/${validated.workId}`);
  return log;
}

export async function stopTimer(data: z.infer<typeof stopSchema>) {
  const user = await requireUser();
  const validated = stopSchema.parse(data);

  const [existing] = await db
    .select()
    .from(timeLog)
    .where(and(eq(timeLog.id, validated.logId), eq(timeLog.userId, user.id)))
    .limit(1);

  if (!existing) throw new Error("Time log not found");

  const endedAt = new Date();
  const durationSeconds = Math.floor(
    (endedAt.getTime() - existing.startedAt.getTime()) / 1000,
  );

  const [updated] = await db
    .update(timeLog)
    .set({
      endedAt,
      durationSeconds,
      note: validated.note ?? existing.note,
    })
    .where(eq(timeLog.id, validated.logId))
    .returning();

  revalidatePath(`/dashboard/work/${existing.workId}`);
  return updated;
}

export async function addManualTimeEntry(data: z.infer<typeof manualSchema>) {
  const user = await requireUser();
  const validated = manualSchema.parse(data);

  const startedAt = new Date(validated.startedAt);
  const endedAt = new Date(validated.endedAt);
  const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

  if (durationSeconds <= 0) throw new Error("End time must be after start time");

  const [log] = await db
    .insert(timeLog)
    .values({
      id: nanoid(),
      workId: validated.workId,
      userId: user.id,
      startedAt,
      endedAt,
      durationSeconds,
      note: validated.note ?? null,
    })
    .returning();

  revalidatePath(`/dashboard/work/${validated.workId}`);
  return log;
}

export async function getWorkTimeLogs(workId: string) {
  await requireUser();

  return db
    .select()
    .from(timeLog)
    .where(eq(timeLog.workId, workId))
    .orderBy(desc(timeLog.startedAt));
}

export async function deleteTimeLog(logId: string) {
  const user = await requireUser();

  const [log] = await db
    .select()
    .from(timeLog)
    .where(and(eq(timeLog.id, logId), eq(timeLog.userId, user.id)))
    .limit(1);

  if (!log) throw new Error("Time log not found");

  await db.delete(timeLog).where(eq(timeLog.id, logId));
  revalidatePath(`/dashboard/work/${log.workId}`);
}

export async function getTotalTimeForWork(workId: string): Promise<number> {
  await requireUser();

  const result = await db
    .select({ total: sum(timeLog.durationSeconds) })
    .from(timeLog)
    .where(eq(timeLog.workId, workId));

  return Number(result[0]?.total ?? 0);
}
