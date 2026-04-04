"use server";

import { requireUser } from "@/actions/auth/session";
import { db } from "@/db";
import { work } from "@/db/schema/work";
import { eq, desc, sql } from "drizzle-orm";
import { generateEmbedding, embeddingToString } from "@/lib/embeddings";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  teamId: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
});

export async function semanticSearch(rawInput: unknown) {
  const input = searchSchema.parse(rawInput);
  const user = await requireUser();

  const queryEmbedding = await generateEmbedding(input.query);
  const embeddingStr = embeddingToString(queryEmbedding);

  const teamFilter = input.teamId ? eq(work.teamId, input.teamId) : undefined;

  const results = await db
    .select({
      id: work.id,
      title: work.title,
      description: work.description,
      type: work.type,
      stage: work.stage,
      priority: work.priority,
      similarity: sql<number>`1 - (${work.embedding}::jsonb <-> ${embeddingStr}::jsonb)`,
    })
    .from(work)
    .where(teamFilter ? eq(work.teamId, input.teamId!) : undefined)
    .orderBy(desc(sql`1 - (${work.embedding}::jsonb <-> ${embeddingStr}::jsonb)`))
    .limit(input.limit);

  return results;
}
