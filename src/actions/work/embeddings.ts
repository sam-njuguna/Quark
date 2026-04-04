"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { eq } from "drizzle-orm";
import { generateWorkEmbedding, embeddingToString } from "@/lib/embeddings";
import { nanoid } from "nanoid";

export async function updateWorkEmbedding(workId: string) {
  const workItem = await db.query.work.findFirst({
    where: eq(work.id, workId),
  });

  if (!workItem) {
    throw new Error("Work not found");
  }

  const embedding = await generateWorkEmbedding(
    workItem.title,
    workItem.description,
    workItem.type
  );

  await db
    .update(work)
    .set({ embedding: embeddingToString(embedding) })
    .where(eq(work.id, workId));
}

export async function createWorkEmbedding(
  title: string,
  description: string | null,
  type: string,
  workId: string
) {
  const embedding = await generateWorkEmbedding(title, description, type);

  await db
    .update(work)
    .set({ embedding: embeddingToString(embedding) })
    .where(eq(work.id, workId));
}
