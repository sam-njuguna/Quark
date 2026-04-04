"use server";

import { db } from "@/db";
import { work, workOutput } from "@/db/schema/work";
import { comment } from "@/db/schema/comments";
import { activity } from "@/db/schema/activity";
import { user as userTable } from "@/db/schema/auth-schema";
import { agent } from "@/db/schema/agent";
import { requireUser } from "@/actions/auth/session";
import { eq, desc, gt, and } from "drizzle-orm";

export async function getWork(workId: string) {
  await requireUser();

  const [workItem] = await db.select().from(work).where(eq(work.id, workId));

  if (!workItem) {
    throw new Error("Work not found");
  }

  // Get outputs
  const outputs = await db
    .select()
    .from(workOutput)
    .where(eq(workOutput.workId, workId))
    .orderBy(desc(workOutput.version));

  // Get comments with author info
  const rawComments = await db
    .select({
      id: comment.id,
      workId: comment.workId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorName: userTable.name,
      authorEmail: userTable.email,
      authorImage: userTable.image,
    })
    .from(comment)
    .leftJoin(userTable, eq(userTable.id, comment.authorId))
    .where(eq(comment.workId, workId))
    .orderBy(desc(comment.createdAt));

  const comments = rawComments.map((c) => ({
    id: c.id,
    workId: c.workId,
    authorId: c.authorId,
    content: c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    author: {
      name: c.authorName,
      email: c.authorEmail ?? "",
      image: c.authorImage,
    },
  }));

  // Recent viewers: users who interacted in the last 10 minutes (presence)
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentActivity = await db
    .select({
      userId: activity.userId,
      name: userTable.name,
      image: userTable.image,
      action: activity.action,
      createdAt: activity.createdAt,
    })
    .from(activity)
    .innerJoin(userTable, eq(userTable.id, activity.userId))
    .where(and(eq(activity.workId, workId), gt(activity.createdAt, tenMinsAgo)))
    .orderBy(desc(activity.createdAt))
    .limit(5);

  // Get AI agent info if assigned
  let aiAgentInfo = null;
  if (workItem.aiAgentId) {
    const [aiAgent] = await db
      .select({
        id: agent.id,
        name: agent.name,
        agentType: agent.agentType,
      })
      .from(agent)
      .where(eq(agent.id, workItem.aiAgentId))
      .limit(1);
    if (aiAgent) {
      aiAgentInfo = aiAgent;
    }
  }

  return {
    ...workItem,
    outputs,
    comments,
    recentViewers: recentActivity,
    aiAgentInfo,
  };
}
