"use server";

import { cookies } from "next/headers";
import { db } from "@/db";
import { teamMember } from "@/db/schema/teams";
import { eq, and } from "drizzle-orm";
import { requireUser, isPrivilegedUser } from "@/actions/auth/session";
import { getUserTeams } from "@/actions/auth/session";

const COOKIE_NAME = "quark-active-team";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function setActiveTeam(teamId: string): Promise<void> {
  const currentUser = await requireUser();
  const privileged = await isPrivilegedUser(currentUser.id);

  if (!privileged) {
    const [membership] = await db
      .select()
      .from(teamMember)
      .where(
        and(
          eq(teamMember.userId, currentUser.id),
          eq(teamMember.teamId, teamId),
        ),
      )
      .limit(1);
    if (!membership) throw new Error("Not a member of this team");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, teamId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function getActiveTeamId(userId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(COOKIE_NAME)?.value;

  if (stored) {
    const [membership] = await db
      .select()
      .from(teamMember)
      .where(
        and(eq(teamMember.userId, userId), eq(teamMember.teamId, stored)),
      )
      .limit(1);
    if (membership) return stored;
  }

  const teams = await getUserTeams(userId);
  return teams[0]?.id ?? null;
}
