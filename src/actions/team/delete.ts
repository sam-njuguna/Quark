"use server";

import { db } from "@/db";
import { team, teamMember } from "@/db/schema/teams";
import { requireUser, getSystemRole } from "@/actions/auth/session";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteTeam(
  teamId: string,
  opts: { reassignMembersToTeamId?: string } = {},
) {
  await requireUser();

  const [existing] = await db
    .select({ id: team.id, name: team.name })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);

  if (!existing) throw new Error("Team not found");

  // Re-parent any sub-teams to this team's parent (or make them root)
  const [parent] = await db
    .select({ parentId: team.parentId })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);

  const children = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.parentId, teamId));

  for (const child of children) {
    await db
      .update(team)
      .set({ parentId: parent?.parentId ?? null, updatedAt: new Date() })
      .where(eq(team.id, child.id));
  }

  // Reassign members to another team if specified
  if (opts.reassignMembersToTeamId) {
    const members = await db
      .select({ userId: teamMember.userId })
      .from(teamMember)
      .where(eq(teamMember.teamId, teamId));

    for (const member of members) {
      const alreadyMember = await db
        .select({ id: teamMember.id })
        .from(teamMember)
        .where(eq(teamMember.teamId, opts.reassignMembersToTeamId))
        .limit(1);

      if (alreadyMember.length === 0) {
        await db.insert(teamMember).values({
          id: crypto.randomUUID(),
          teamId: opts.reassignMembersToTeamId,
          userId: member.userId,
          role: "member",
        });
      }
    }
  }

  // work.teamId is set null on cascade — no manual nulling needed.
  // teamMember rows are deleted on cascade via FK.
  await db.delete(team).where(eq(team.id, teamId));

  revalidatePath("/dashboard/hierarchy");
  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/settings");
}

export async function updateTeam(
  teamId: string,
  data: { name?: string; description?: string | null },
) {
  const currentUser = await requireUser();
  const systemRole = await getSystemRole(currentUser.id);

  if (systemRole !== "super_admin") {
    const [membership] = await db
      .select({ role: teamMember.role })
      .from(teamMember)
      .where(
        and(
          eq(teamMember.userId, currentUser.id),
          eq(teamMember.teamId, teamId),
        ),
      )
      .limit(1);
    if (!membership || !["admin"].includes(membership.role)) {
      throw new Error("Only admins and super_admins can edit teams");
    }
  }

  await db
    .update(team)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(team.id, teamId));

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/hierarchy");
}

export async function bulkDeleteTeams(teamIds: string[]) {
  const currentUser = await requireUser();
  const systemRole = await getSystemRole(currentUser.id);

  if (systemRole !== "super_admin") {
    throw new Error("Only super_admins can bulk delete teams");
  }

  for (const teamId of teamIds) {
    // Re-parent children first
    const children = await db
      .select({ id: team.id })
      .from(team)
      .where(eq(team.parentId, teamId));

    for (const child of children) {
      await db
        .update(team)
        .set({ parentId: null, updatedAt: new Date() })
        .where(eq(team.id, child.id));
    }
  }

  await db.delete(team).where(inArray(team.id, teamIds));

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/hierarchy");
  revalidatePath("/dashboard/team");
}
