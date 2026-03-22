"use server";

import { db } from "@/db";
import { apiKey } from "@/db/schema/api-key";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getDisabledTools(): Promise<string[]> {
  const user = await requireUser();
  const [key] = await db
    .select({ disabledTools: apiKey.disabledTools })
    .from(apiKey)
    .where(eq(apiKey.userId, user.id))
    .limit(1);
  return (key?.disabledTools as string[]) ?? [];
}

export async function setToolEnabled(toolName: string, enabled: boolean) {
  const user = await requireUser();
  const [key] = await db
    .select({ id: apiKey.id, disabledTools: apiKey.disabledTools })
    .from(apiKey)
    .where(eq(apiKey.userId, user.id))
    .limit(1);

  if (!key) throw new Error("No API key found");

  const current = (key.disabledTools as string[]) ?? [];
  const updated = enabled
    ? current.filter((t) => t !== toolName)
    : current.includes(toolName)
      ? current
      : [...current, toolName];

  await db
    .update(apiKey)
    .set({ disabledTools: updated })
    .where(eq(apiKey.id, key.id));

  revalidatePath("/dashboard/settings");
}
