"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteWork(workId: string) {
  const user = await requireUser();

  const [workItem] = await db
    .select()
    .from(work)
    .where(eq(work.id, workId))
    .limit(1);

  if (!workItem) {
    throw new Error("Work item not found");
  }

  if (workItem.createdBy !== user.id) {
    throw new Error("Not authorized to delete this work item");
  }

  await db.delete(work).where(eq(work.id, workId));

  revalidatePath("/");
}
