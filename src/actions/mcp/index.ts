"use server";

import { db } from "@/db";
import { work, workOutput } from "@/db/schema/work";
import { comment } from "@/db/schema/comments";
import { activity } from "@/db/schema/activity";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

export type McpUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

const createWorkSchema = z.object({
  title: z.string().min(1).max(200),
  type: z
    .enum(["task", "meeting", "research", "code", "document", "communication"])
    .optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  assignedTo: z.string().optional(),
  teamId: z.string().optional(),
  priority: z.number().min(1).max(3).optional(),
  dueDate: z.string().optional(),
  successCriteria: z.array(z.string()).optional(),
});

export async function mcpCreateWork(
  user: McpUser,
  data: z.infer<typeof createWorkSchema>,
) {
  const validated = createWorkSchema.parse(data);

  const [newWork] = await db
    .insert(work)
    .values({
      id: nanoid(),
      title: validated.title,
      type: validated.type || "task",
      description: validated.description,
      instructions: validated.instructions,
      assignedTo: validated.assignedTo,
      teamId: validated.teamId,
      priority: validated.priority || 2,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      successCriteria: validated.successCriteria,
      createdBy: user.id,
      stage: "new",
    })
    .returning();

  return newWork;
}

interface ListWorkOptions {
  stage?: string;
  assignedTo?: string;
  createdBy?: string;
  type?: string;
  teamId?: string;
  limit?: number;
}

export async function mcpListWork(
  user: McpUser,
  options: ListWorkOptions = {},
) {
  const { stage, assignedTo, createdBy, type, teamId, limit = 20 } = options;

  const conditions = [];

  if (stage) conditions.push(eq(work.stage, stage));
  if (assignedTo) conditions.push(eq(work.assignedTo, assignedTo));
  if (createdBy) conditions.push(eq(work.createdBy, createdBy));
  if (type) conditions.push(eq(work.type, type));
  if (teamId) conditions.push(eq(work.teamId, teamId));

  return db
    .select()
    .from(work)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(work.createdAt))
    .limit(limit);
}

export async function mcpListMyWork(user: McpUser) {
  return mcpListWork(user, { assignedTo: user.id });
}

export async function mcpGetWork(user: McpUser, workId: string) {
  const [workItem] = await db.select().from(work).where(eq(work.id, workId));
  if (!workItem) throw new Error("Work not found");

  const outputs = await db
    .select()
    .from(workOutput)
    .where(eq(workOutput.workId, workId))
    .orderBy(desc(workOutput.version));

  const comments = await db
    .select()
    .from(comment)
    .where(eq(comment.workId, workId))
    .orderBy(desc(comment.createdAt));

  return { ...workItem, outputs, comments };
}

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

export async function mcpUpdateStage(
  user: McpUser,
  workId: string,
  newStage: string,
  reason?: string,
) {
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));
  if (!currentWork) throw new Error("Work not found");

  const allowed = stageTransitions[currentWork.stage] || [];
  if (!allowed.includes(newStage)) {
    throw new Error(
      `Cannot transition from ${currentWork.stage} to ${newStage}`,
    );
  }

  const updates: Record<string, unknown> = {
    stage: newStage,
    updatedAt: new Date(),
  };

  if (newStage === "in_progress") updates.claimedBy = user.id;
  if (newStage === "awaiting_review") updates.submittedAt = new Date();
  if (newStage === "done") updates.completedAt = new Date();
  if (newStage === "blocked") updates.blockedReason = reason;

  const [updatedWork] = await db
    .update(work)
    .set(updates)
    .where(eq(work.id, workId))
    .returning();

  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "stage_changed",
    metadata: { from: currentWork.stage, to: newStage, reason },
  });

  return updatedWork;
}

export async function mcpSubmitWork(
  user: McpUser,
  workId: string,
  content: Record<string, unknown>,
  contentType: "markdown" | "json" | "files" = "markdown",
) {
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));
  if (!currentWork) throw new Error("Work not found");

  if (currentWork.claimedBy !== user.id && currentWork.assignedTo !== user.id) {
    throw new Error("Not authorized to submit this work");
  }

  const [latest] = await db
    .select()
    .from(workOutput)
    .where(eq(workOutput.workId, workId))
    .orderBy(desc(workOutput.version))
    .limit(1);

  const newVersion = (latest?.version || 0) + 1;

  await db.insert(workOutput).values({
    id: nanoid(),
    workId,
    content,
    contentType,
    submittedBy: user.id,
    version: newVersion,
  });

  const [updatedWork] = await db
    .update(work)
    .set({
      stage: "awaiting_review",
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(work.id, workId))
    .returning();

  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "submitted",
    metadata: { version: newVersion },
  });

  return { success: true, version: newVersion, work: updatedWork };
}

export async function mcpApproveWork(user: McpUser, workId: string) {
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));
  if (!currentWork) throw new Error("Work not found");
  if (currentWork.stage !== "awaiting_review") {
    throw new Error("Work must be in awaiting_review stage to approve");
  }

  const [updatedWork] = await db
    .update(work)
    .set({ stage: "done", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(work.id, workId))
    .returning();

  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "approved",
    metadata: {},
  });

  return updatedWork;
}

export async function mcpRejectWork(
  user: McpUser,
  workId: string,
  feedback: string,
) {
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));
  if (!currentWork) throw new Error("Work not found");
  if (currentWork.stage !== "awaiting_review") {
    throw new Error("Work must be in awaiting_review stage to reject");
  }

  const [updatedWork] = await db
    .update(work)
    .set({ stage: "revision", updatedAt: new Date() })
    .where(eq(work.id, workId))
    .returning();

  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "rejected",
    metadata: { feedback },
  });

  return updatedWork;
}

export async function mcpBlockWork(
  user: McpUser,
  workId: string,
  reason: string,
) {
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));
  if (!currentWork) throw new Error("Work not found");
  if (!["in_progress", "revision"].includes(currentWork.stage)) {
    throw new Error("Work must be in progress or revision to block");
  }

  const [updatedWork] = await db
    .update(work)
    .set({ stage: "blocked", blockedReason: reason, updatedAt: new Date() })
    .where(eq(work.id, workId))
    .returning();

  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "blocked",
    metadata: { reason },
  });

  return updatedWork;
}

export async function mcpCancelWork(
  user: McpUser,
  workId: string,
  reason?: string,
) {
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));
  if (!currentWork) throw new Error("Work not found");
  if (currentWork.stage === "done" || currentWork.stage === "cancelled") {
    throw new Error("Cannot cancel completed or already cancelled work");
  }

  const [updatedWork] = await db
    .update(work)
    .set({ stage: "cancelled", updatedAt: new Date() })
    .where(eq(work.id, workId))
    .returning();

  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "cancelled",
    metadata: { reason },
  });

  return updatedWork;
}

export async function mcpAssignWork(
  user: McpUser,
  workId: string,
  userId: string,
) {
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));
  if (!currentWork) throw new Error("Work not found");

  const [updatedWork] = await db
    .update(work)
    .set({ assignedTo: userId, updatedAt: new Date() })
    .where(eq(work.id, workId))
    .returning();

  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "assigned",
    metadata: { to: userId },
  });

  return updatedWork;
}

export async function mcpAddComment(
  user: McpUser,
  workId: string,
  content: string,
) {
  const [newComment] = await db
    .insert(comment)
    .values({
      id: nanoid(),
      workId,
      authorId: user.id,
      content,
    })
    .returning();

  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: user.id,
    action: "commented",
    metadata: { commentId: newComment.id, content },
  });

  return newComment;
}

export async function mcpListComments(
  user: McpUser,
  workId: string,
  limit = 50,
) {
  return db
    .select()
    .from(comment)
    .where(eq(comment.workId, workId))
    .orderBy(desc(comment.createdAt))
    .limit(limit);
}

export async function mcpSuggestNextSteps(user: McpUser, workId: string) {
  const { suggestNextSteps } = await import("@/lib/ai-triage");
  const steps = await suggestNextSteps(workId);
  return { workId, steps };
}

export async function mcpAutoTriage(user: McpUser, workId: string) {
  const { analyzeWork } = await import("@/lib/ai-triage");
  const workItem = await db.query.work.findFirst({
    where: eq(work.id, workId),
  });
  if (!workItem) return { error: "Work not found" };
  
  const analysis = await analyzeWork(workItem.title, workItem.description, workItem.type);
  return {
    workId,
    suggestedPriority: analysis.suggestedPriority,
    suggestedType: analysis.suggestedType,
    suggestedStage: analysis.suggestedStage,
    confidence: analysis.confidence,
    reasoning: analysis.reasoning,
  };
}

export async function mcpSummarizeWork(user: McpUser, workId: string) {
  const workItem = await db.query.work.findFirst({
    where: eq(work.id, workId),
  });
  if (!workItem) return { error: "Work not found" };
  
  const comments = await db
    .select()
    .from(comment)
    .where(eq(comment.workId, workId))
    .orderBy(desc(comment.createdAt))
    .limit(10);
  
  return {
    id: workItem.id,
    title: workItem.title,
    type: workItem.type,
    stage: workItem.stage,
    description: workItem.description,
    priority: workItem.priority,
    createdAt: workItem.createdAt,
    commentCount: comments.length,
    recentComments: comments.map(c => ({ author: c.authorId, content: c.content, createdAt: c.createdAt })),
  };
}

export async function mcpFindRelatedWork(user: McpUser, workId: string) {
  const { findSimilarWork } = await import("@/lib/embeddings");
  const related = await findSimilarWork(workId, "", 5);
  return { workId, related };
}
