"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { activity } from "@/db/schema/activity";
import { requireUser } from "@/actions/auth/session";
import { inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

export async function bulkUpdateStage(
  data: z.infer<typeof bulkSchema> & { stage: string },
) {
  const user = await requireUser();
  const { ids, stage } = bulkSchema.extend({ stage: z.string() }).parse(data);

  await db.update(work).set({ stage }).where(inArray(work.id, ids));

  const activityRows = ids.map((workId) => ({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "stage_changed" as const,
    metadata: { stage, bulk: true },
  }));
  if (activityRows.length > 0) {
    await db.insert(activity).values(activityRows);
  }

  revalidatePath("/");
  return { updated: ids.length };
}

export async function bulkAssign(
  data: z.infer<typeof bulkSchema> & { assignedTo: string },
) {
  const user = await requireUser();
  const { ids, assignedTo } = bulkSchema
    .extend({ assignedTo: z.string() })
    .parse(data);

  await db.update(work).set({ assignedTo }).where(inArray(work.id, ids));

  const activityRows = ids.map((workId) => ({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "assigned" as const,
    metadata: { assignedTo, bulk: true },
  }));
  if (activityRows.length > 0) {
    await db.insert(activity).values(activityRows);
  }

  revalidatePath("/");
  return { updated: ids.length };
}

export async function bulkDelete(data: z.infer<typeof bulkSchema>) {
  const user = await requireUser();
  const { ids } = bulkSchema.parse(data);

  const items = await db
    .select({ id: work.id, createdBy: work.createdBy })
    .from(work)
    .where(inArray(work.id, ids));

  const authorized = items.filter((i) => i.createdBy === user.id);
  if (authorized.length === 0) throw new Error("No authorized items to delete");

  await db.delete(work).where(
    inArray(
      work.id,
      authorized.map((i) => i.id),
    ),
  );

  revalidatePath("/");
  return { deleted: authorized.length };
}

export async function bulkSetPriority(
  data: z.infer<typeof bulkSchema> & { priority: number },
) {
  const user = await requireUser();
  const { ids, priority } = bulkSchema
    .extend({ priority: z.number().int().min(1).max(5) })
    .parse(data);

  await db.update(work).set({ priority }).where(inArray(work.id, ids));

  const activityRows = ids.map((workId) => ({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "updated" as const,
    metadata: { priority, bulk: true },
  }));
  if (activityRows.length > 0) {
    await db.insert(activity).values(activityRows);
  }

  revalidatePath("/");
  return { updated: ids.length };
}
