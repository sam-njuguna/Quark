"use server";

import { db } from "@/db";
import { teamMember } from "@/db/schema/teams";
import { work } from "@/db/schema/work";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteUserData(
  targetUserId: string,
  opts: { reassignWorkToUserId?: string } = {},
) {
  const currentUser = await requireUser();

  // Allow self-deletion or admin override (expand as needed)
  if (currentUser.id !== targetUserId) {
    throw new Error("Not authorised to delete this user");
  }

  // 1. Reassign or nullify work assignments
  if (opts.reassignWorkToUserId) {
    await db
      .update(work)
      .set({ assignedTo: opts.reassignWorkToUserId, updatedAt: new Date() })
      .where(eq(work.assignedTo, targetUserId));
  } else {
    await db
      .update(work)
      .set({ assignedTo: null, updatedAt: new Date() })
      .where(eq(work.assignedTo, targetUserId));
  }

  // 2. Remove from all team memberships
  await db.delete(teamMember).where(eq(teamMember.userId, targetUserId));

  // 3. Work items created by user remain (createdBy has onDelete cascade on the user FK,
  //    handled at DB level). Reassign if needed:
  if (opts.reassignWorkToUserId) {
    await db
      .update(work)
      .set({ createdBy: opts.reassignWorkToUserId, updatedAt: new Date() })
      .where(eq(work.createdBy, targetUserId));
  }

  // Note: actual user account deletion is handled by Better Auth's own account deletion flow.
  // Call auth.api.deleteUser() from the auth client to remove the auth record.

  revalidatePath("/dashboard");
}
