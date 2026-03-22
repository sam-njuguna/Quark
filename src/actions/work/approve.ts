"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { activity } from "@/db/schema/activity";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { notifyWorkApproved } from "@/actions/notifications";
import { triggerWebhooks } from "@/actions/webhooks";

export async function approveWork(workId: string) {
  const user = await requireUser();

  // Get current work
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));

  if (!currentWork) {
    throw new Error("Work not found");
  }

  if (currentWork.stage !== "awaiting_review") {
    throw new Error("Work must be in awaiting_review stage to approve");
  }

  // Update work
  const [updatedWork] = await db
    .update(work)
    .set({
      stage: "done",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(work.id, workId))
    .returning();

  // Log activity
  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "approved",
    metadata: {},
  });

  // Notify the assignee
  if (currentWork.assignedTo) {
    notifyWorkApproved(workId, currentWork.assignedTo).catch(console.error);
  }

  if (currentWork.teamId) {
    triggerWebhooks(currentWork.teamId, "work.completed", {
      id: workId,
      title: currentWork.title,
      approvedBy: user.id,
    }).catch(console.error);
  }

  revalidatePath("/");
  return updatedWork;
}
