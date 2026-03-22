"use server";

import { requireUser } from "@/actions/auth/session";
import { revalidatePath } from "next/cache";

const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

const locks = new Map<
  string,
  { userId: string; expiresAt: number; userName: string }
>();

export async function acquireLock(
  workId: string,
): Promise<{ success: boolean; lockedBy?: string }> {
  const user = await requireUser();
  const now = Date.now();

  const existing = locks.get(workId);
  if (existing && existing.expiresAt > now && existing.userId !== user.id) {
    return { success: false, lockedBy: existing.userName };
  }

  locks.set(workId, {
    userId: user.id,
    expiresAt: now + LOCK_TTL_MS,
    userName: user.name ?? user.email ?? "Someone",
  });

  revalidatePath(`/dashboard/work/${workId}`);
  return { success: true };
}

export async function releaseLock(workId: string): Promise<void> {
  const user = await requireUser();
  const lock = locks.get(workId);
  if (lock?.userId === user.id) {
    locks.delete(workId);
    revalidatePath(`/dashboard/work/${workId}`);
  }
}

export async function getLockStatus(
  workId: string,
): Promise<{ locked: boolean; lockedBy?: string } | null> {
  await requireUser();
  const now = Date.now();
  const lock = locks.get(workId);
  if (!lock || lock.expiresAt <= now) {
    locks.delete(workId);
    return { locked: false };
  }
  return { locked: true, lockedBy: lock.userName };
}
