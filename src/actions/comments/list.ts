"use server";

import { db } from "@/db";
import { comment } from "@/db/schema/comments";
import { user } from "@/db/schema/auth-schema";
import { eq, desc } from "drizzle-orm";

interface ListCommentsOptions {
  workId: string;
  limit?: number;
}

export async function listComments(options: ListCommentsOptions) {
  const { workId, limit = 50 } = options;

  const results = await db
    .select({
      id: comment.id,
      workId: comment.workId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(comment)
    .leftJoin(user, eq(comment.authorId, user.id))
    .where(eq(comment.workId, workId))
    .orderBy(desc(comment.createdAt))
    .limit(limit);

  return results;
}
