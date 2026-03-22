"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { activity } from "@/db/schema/activity";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { triggerWebhooks } from "@/actions/webhooks";

export async function cancelWork(workId: string, reason?: string) {
  const user = await requireUser();

  // Get current work
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));

  if (!currentWork) {
    throw new Error("Work not found");
  }

  if (currentWork.stage === "done" || currentWork.stage === "cancelled") {
    throw new Error("Cannot cancel completed or already cancelled work");
  }

  // Update work
  const [updatedWork] = await db
    .update(work)
    .set({
      stage: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(work.id, workId))
    .returning();

  // Log activity
  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "cancelled",
    metadata: { reason },
  });

  if (currentWork.teamId) {
    triggerWebhooks(currentWork.teamId, "work.cancelled", {
      id: workId,
      title: currentWork.title,
      reason,
      cancelledBy: user.id,
    }).catch(console.error);
  }

  revalidatePath("/");
  return updatedWork;
}
