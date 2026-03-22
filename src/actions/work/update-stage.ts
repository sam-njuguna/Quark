"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { activity } from "@/db/schema/activity";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

const stageTransitions: Record<string, string[]> = {
  new: ["triaged", "cancelled"],
  triaged: ["in_progress", "cancelled"],
  in_progress: ["awaiting_review", "blocked", "cancelled"],
  awaiting_review: ["revision", "done", "cancelled"],
  revision: ["awaiting_review", "blocked", "cancelled"],
  blocked: ["in_progress", "cancelled"],
  done: [],
  cancelled: [],
};

export async function updateStage(
  workId: string,
  newStage: string,
  reason?: string,
  force = false,
) {
  const user = await requireUser();

  // Get current work
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));

  if (!currentWork) {
    throw new Error("Work not found");
  }

  // Skip if already in the target stage
  if (currentWork.stage === newStage) {
    return currentWork;
  }

  // Validate transition (skip when force=true, e.g. manual kanban drag)
  if (!force) {
    const allowed = stageTransitions[currentWork.stage] || [];
    if (!allowed.includes(newStage)) {
      throw new Error(
        `Cannot transition from ${currentWork.stage} to ${newStage}`,
      );
    }
  }

  // Prevent moving to "triaged" if work is not assigned
  if (newStage === "triaged" && !currentWork.assignedTo) {
    throw new Error("Cannot triage unassigned work. Please assign someone first.");
  }

  // Build updates
  const updates: Record<string, unknown> = {
    stage: newStage,
    updatedAt: new Date(),
  };

  if (newStage === "in_progress") {
    updates.claimedBy = user.id;
  }

  if (newStage === "awaiting_review") {
    updates.submittedAt = new Date();
  }

  if (newStage === "done") {
    updates.completedAt = new Date();
  }

  if (newStage === "blocked") {
    updates.blockedReason = reason;
  }

  // Update work
  const [updatedWork] = await db
    .update(work)
    .set(updates)
    .where(eq(work.id, workId))
    .returning();

  // Log activity
  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "stage_changed",
    metadata: { from: currentWork.stage, to: newStage, reason },
  });

  revalidatePath("/");
  return updatedWork;
}
