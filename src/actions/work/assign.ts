"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { activity } from "@/db/schema/activity";
import { teamMember } from "@/db/schema/teams";
import { requireUser, getSystemRole } from "@/actions/auth/session";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { notifyWorkAssigned } from "@/actions/notifications";

export async function assignWork(workId: string, userId: string) {
  const currentUser = await requireUser();

  // Get current work
  const [currentWork] = await db.select().from(work).where(eq(work.id, workId));

  if (!currentWork) {
    throw new Error("Work not found");
  }

  // Self-assignment is always allowed
  const isSelfAssignment = userId === currentUser.id;

  if (!isSelfAssignment) {
    // Check permissions for assigning to others
    const systemRole = await getSystemRole(currentUser.id);
    const isSuperAdmin = systemRole === "super_admin";

    // Get current user's role in the work's team
    const [currentUserMembership] = await db
      .select({ role: teamMember.role })
      .from(teamMember)
      .where(
        and(
          eq(teamMember.teamId, currentWork.teamId!),
          eq(teamMember.userId, currentUser.id),
        ),
      )
      .limit(1);

    const isTeamAdmin = currentUserMembership?.role === "admin";
    const isTeamLead = currentUserMembership?.role === "lead" || isTeamAdmin;

    // Super admins and team admins can assign to anyone
    if (!isSuperAdmin && !isTeamAdmin) {
      // Leads can only assign to members of their team
      if (isTeamLead) {
        // Verify target user is in the same team
        const [targetMembership] = await db
          .select({ id: teamMember.id })
          .from(teamMember)
          .where(
            and(
              eq(teamMember.teamId, currentWork.teamId!),
              eq(teamMember.userId, userId),
            ),
          )
          .limit(1);

        if (!targetMembership) {
          throw new Error("You can only assign work to members of your team");
        }
      } else {
        // Regular members cannot assign to others
        throw new Error("You can only assign work to yourself");
      }
    }
  }

  // Update work
  const [updatedWork] = await db
    .update(work)
    .set({
      assignedTo: userId,
      updatedAt: new Date(),
    })
    .where(eq(work.id, workId))
    .returning();

  // Log activity
  await db.insert(activity).values({
    id: nanoid(),
    workId,
    userId: currentUser.id,
    action: "assigned",
    metadata: { to: userId },
  });

  // Notify the new assignee
  if (userId !== currentUser.id) {
    notifyWorkAssigned(workId, userId, currentUser.name || undefined).catch(
      console.error,
    );
  }

  revalidatePath("/");
  return updatedWork;
}
