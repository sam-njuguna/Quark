"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { activity } from "@/db/schema/activity";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export async function cloneWork(workId: string) {
  const user = await requireUser();

  const [original] = await db
    .select()
    .from(work)
    .where(eq(work.id, workId))
    .limit(1);

  if (!original) {
    throw new Error("Work item not found");
  }

  const newId = nanoid();

  const [cloned] = await db
    .insert(work)
    .values({
      id: newId,
      title: `${original.title} (Copy)`,
      type: original.type,
      description: original.description,
      instructions: original.instructions,
      successCriteria: original.successCriteria,
      teamId: original.teamId,
      createdBy: user.id,
      assignedTo: null,
      claimedBy: null,
      stage: "new",
      priority: original.priority,
      dueDate: original.dueDate,
    })
    .returning();

  await db.insert(activity).values({
    id: nanoid(),
    workId: newId,
    userId: user.id,
    action: "created",
    metadata: { clonedFrom: workId, clonedFromTitle: original.title },
  });

  revalidatePath("/");

  return cloned;
}
