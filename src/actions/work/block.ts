"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { activity } from "@/db/schema/activity";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { notifyWorkBlocked } from "@/actions/notifications";
import { triggerWebhooks } from "@/actions/webhooks";

export async function blockWork(workId: string, reason: string) {
  const user = await requireUser();

  // Get current work
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));

  if (!currentWork) {
    throw new Error("Work not found");
  }

  if (!["in_progress", "revision"].includes(currentWork.stage)) {
    throw new Error("Work must be in progress or revision to block");
  }

  // Update work
  const [updatedWork] = await db
    .update(work)
    .set({
      stage: "blocked",
      blockedReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(work.id, workId))
    .returning();

  // Log activity
  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "blocked",
    metadata: { reason },
  });

  // Notify the creator
  if (currentWork.createdBy) {
    notifyWorkBlocked(workId, currentWork.createdBy).catch(console.error);
  }

  if (currentWork.teamId) {
    triggerWebhooks(currentWork.teamId, "work.blocked", {
      id: workId,
      title: currentWork.title,
      reason,
      blockedBy: user.id,
    }).catch(console.error);
  }

  revalidatePath("/");
  return updatedWork;
}
