"use server";

import { requireUser } from "@/actions/auth/session";
import { findSimilarWork as findSimilar } from "@/lib/embeddings";
import { z } from "zod";

const schema = z.object({
  workId: z.string(),
  limit: z.number().min(1).max(20).default(5),
});

export async function findSimilarWork(rawInput: unknown) {
  const input = schema.parse(rawInput);
  const user = await requireUser();

  return findSimilar(input.workId, "", input.limit);
}
