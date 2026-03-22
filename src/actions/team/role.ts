"use server";

import { db } from "@/db";
import { teamMember } from "@/db/schema/teams";
import { requireUser } from "@/actions/auth/session";
import { eq, and } from "drizzle-orm";

export async function getMyRole(
  teamId: string,
): Promise<"member" | "lead" | "admin" | null> {
  const user = await requireUser();

  const [membership] = await db
    .select({ role: teamMember.role })
    .from(teamMember)
    .where(
      and(eq(teamMember.teamId, teamId), eq(teamMember.userId, user.id)),
    );

  if (!membership) return null;
  return membership.role as "member" | "lead" | "admin";
}

export async function getMyRoleInAnyTeam(): Promise<
  "member" | "lead" | "admin" | null
> {
  const user = await requireUser();

  const [membership] = await db
    .select({ role: teamMember.role })
    .from(teamMember)
    .where(eq(teamMember.userId, user.id));

  if (!membership) return null;
  return membership.role as "member" | "lead" | "admin";
}
