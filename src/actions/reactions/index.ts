"use server";

import { db } from "@/db";
import { reaction } from "@/db/schema/reactions";
import { requireUser } from "@/actions/auth/session";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function toggleReaction(workId: string, emoji: string) {
  const user = await requireUser();

  const [existing] = await db
    .select()
    .from(reaction)
    .where(and(eq(reaction.workId, workId), eq(reaction.userId, user.id), eq(reaction.emoji, emoji)));

  if (existing) {
    await db.delete(reaction).where(eq(reaction.id, existing.id));
    return { added: false };
  }

  await db.insert(reaction).values({ id: nanoid(), workId, userId: user.id, emoji });
  return { added: true };
}

export async function listReactions(workId: string) {
  const rows = await db
    .select({
      emoji: reaction.emoji,
      count: sql<number>`count(*)::int`,
    })
    .from(reaction)
    .where(eq(reaction.workId, workId))
    .groupBy(reaction.emoji);
  return rows;
}

export async function getMyReactions(workId: string) {
  const user = await requireUser();
  const rows = await db
    .select({ emoji: reaction.emoji })
    .from(reaction)
    .where(and(eq(reaction.workId, workId), eq(reaction.userId, user.id)));
  return rows.map((r) => r.emoji);
}
