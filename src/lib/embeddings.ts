import { db } from "@/db";
import { work } from "@/db/schema/work";
import { eq, desc, sql, not } from "drizzle-orm";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Quark",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export async function generateWorkEmbedding(
  title: string,
  description: string | null,
  type: string
): Promise<number[]> {
  const text = [title, description || "", type].join(" ");
  return generateEmbedding(text);
}

export function embeddingToString(embedding: number[]): string {
  return JSON.stringify(embedding);
}

export function stringToEmbedding(str: string): number[] {
  return JSON.parse(str);
}

export async function findSimilarWork(
  workId: string,
  _teamId: string,
  limit: number = 5
): Promise<{ id: string; title: string; similarity: number }[]> {
  const targetWork = await db.query.work.findFirst({
    where: eq(work.id, workId),
  });

  if (!targetWork?.embedding) {
    return [];
  }

  const targetEmbedding = stringToEmbedding(targetWork.embedding);

  const results = await db
    .select({
      id: work.id,
      title: work.title,
      similarity: sql<number>`1 - (${work.embedding}::text::real[] <-> ${JSON.stringify(targetEmbedding)}::real[])`,
    })
    .from(work)
    .where(not(eq(work.id, workId)))
    .orderBy(desc(sql`1 - (${work.embedding}::text::real[] <-> ${JSON.stringify(targetEmbedding)}::real[])`))
    .limit(limit);

  return results;
}
