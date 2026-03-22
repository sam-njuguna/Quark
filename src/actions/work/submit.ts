"use server";

import { db } from "@/db";
import { work, workOutput } from "@/db/schema/work";
import { activity } from "@/db/schema/activity";
import { requireUser } from "@/actions/auth/session";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { notifyWorkSubmitted } from "@/actions/notifications";

export async function submitWork(
  workId: string,
  content: Record<string, unknown>,
  contentType: "markdown" | "json" | "files" = "markdown",
) {
  const user = await requireUser();

  // Get current work
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));

  if (!currentWork) {
    throw new Error("Work not found");
  }

  // Verify user is authorized (claimer or assignee)
  if (currentWork.claimedBy !== user.id && currentWork.assignedTo !== user.id) {
    throw new Error("Not authorized to submit this work");
  }

  // Get latest version
  const [latest] = await db
    .select()
    .from(workOutput)
    .where(eq(workOutput.workId, workId))
    .orderBy(desc(workOutput.version))
    .limit(1);

  const newVersion = (latest?.version || 0) + 1;

  // Save output
  await db.insert(workOutput).values({
    id: nanoid(),
    workId,
    content,
    contentType,
    submittedBy: user.id,
    version: newVersion,
  });

  // Update work stage
  const [updatedWork] = await db
    .update(work)
    .set({
      stage: "awaiting_review",
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(work.id, workId))
    .returning();

  // Log activity
  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "submitted",
    metadata: { version: newVersion },
  });

  // Notify the creator
  if (currentWork.createdBy && currentWork.createdBy !== user.id) {
    notifyWorkSubmitted(
      workId,
      currentWork.createdBy,
      user.name || undefined,
    ).catch(console.error);
  }

  revalidatePath("/");
  return { success: true, version: newVersion, work: updatedWork };
}
