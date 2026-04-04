"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateWorkEmbedding } from "./embeddings";

interface UpdateWorkInput {
  title?: string;
  description?: string;
  dueDate?: Date | null;
  priority?: number;
}

export async function updateWork(workId: string, input: UpdateWorkInput) {
  await requireUser();

  const [existing] = await db
    .select({ id: work.id })
    .from(work)
    .where(eq(work.id, workId))
    .limit(1);

  if (!existing) throw new Error("Work item not found");

  await db
    .update(work)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(work.id, workId));

  updateWorkEmbedding(workId).catch(console.error);

  revalidatePath("/");

  return { success: true };
}
