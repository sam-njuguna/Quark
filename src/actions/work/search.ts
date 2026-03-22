"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { requireUser } from "@/actions/auth/session";
import { ilike, or } from "drizzle-orm";

export async function searchWork(query: string) {
  await requireUser();

  if (!query.trim()) return [];

  const pattern = `%${query.trim()}%`;

  const results = await db
    .select({
      id: work.id,
      title: work.title,
      type: work.type,
      stage: work.stage,
    })
    .from(work)
    .where(or(ilike(work.title, pattern), ilike(work.description, pattern)))
    .limit(10);

  return results;
}
