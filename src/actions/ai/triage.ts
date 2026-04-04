"use server";

import { requireUser } from "@/actions/auth/session";
import { analyzeWork, suggestNextSteps } from "@/lib/ai-triage";
import { z } from "zod";

const triageSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

export async function aiTriage(rawInput: unknown) {
  const input = triageSchema.parse(rawInput);
  return analyzeWork(input.title, input.description ?? null);
}

export async function aiGetNextSteps(workId: string) {
  return suggestNextSteps(workId);
}
