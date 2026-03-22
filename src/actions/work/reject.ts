"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { activity } from "@/db/schema/activity";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { notifyWorkRejected } from "@/actions/notifications";

export async function rejectWork(workId: string, feedback: string) {
  const user = await requireUser();

  // Get current work
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));

  if (!currentWork) {
    throw new Error("Work not found");
  }

  if (currentWork.stage !== "awaiting_review") {
    throw new Error("Work must be in awaiting_review stage to reject");
  }

  // Update work
  const [updatedWork] = await db
    .update(work)
    .set({
      stage: "revision",
      updatedAt: new Date(),
    })
    .where(eq(work.id, workId))
    .returning();

  // Log activity
  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "rejected",
    metadata: { feedback },
  });

  // Notify the assignee
  if (currentWork.assignedTo) {
    notifyWorkRejected(workId, currentWork.assignedTo).catch(console.error);
  }

  revalidatePath("/");
  return updatedWork;
}
