"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { cache } from "react";
import { headers } from "next/headers";
import { team, teamMember } from "@/db/schema/teams";
import { apiKey } from "@/db/schema/api-key";
import { user } from "@/db/schema/auth-schema";

export type SystemRole = "user" | "super_admin";
export type TeamRole = "member" | "lead" | "admin";

export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

export const requireUser = async () => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
};

export const getSystemRole = async (userId: string): Promise<SystemRole> => {
  const [row] = await db
    .select({ systemRole: user.systemRole })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return (row?.systemRole ?? "user") as SystemRole;
};

export const isPrivilegedUser = async (userId: string): Promise<boolean> => {
  const systemRole = await getSystemRole(userId);
  if (systemRole === "super_admin") return true;

  const [adminMembership] = await db
    .select({ role: teamMember.role })
    .from(teamMember)
    .where(and(eq(teamMember.userId, userId), eq(teamMember.role, "admin")))
    .limit(1);

  return !!adminMembership;
};

export const getUserTeams = async (userId: string) => {
  const memberships = await db
    .select({
      team: team,
      role: teamMember.role,
    })
    .from(teamMember)
    .leftJoin(team, eq(teamMember.teamId, team.id))
    .where(eq(teamMember.userId, userId));

  return memberships.map((m) => ({
    ...m.team!,
    role: m.role,
  }));
};

export const getUserWithTeams = async () => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const memberships = await getUserTeams(session.user.id);

  return {
    session,
    teams: memberships,
    user: session.user,
  };
};

export const requireRole = async (role: "member" | "lead" | "admin") => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const memberships = await db
    .select({
      team: team,
      role: teamMember.role,
    })
    .from(teamMember)
    .leftJoin(team, eq(teamMember.teamId, team.id))
    .where(eq(teamMember.userId, session.user.id));

  const hasRole = memberships.some((m) => m.role === role);
  if (!hasRole) {
    throw new Error(`User is not a team ${role}`);
  }

  return {
    session,
    teams: memberships.map((m) => m.team!),
    user: session.user,
    role: role,
  };
};

export const signOut = async () => {
  await auth.api.signOut({
    headers: await headers(),
  });
};

export async function validateApiKey(key: string) {
  if (!key?.startsWith("qkp_")) {
    return null;
  }

  const result = await db
    .select({
      apiKey: apiKey,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(apiKey)
    .innerJoin(user, eq(apiKey.userId, user.id))
    .where(eq(apiKey.key, key))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { apiKey: keyRecord, user: userData } = result[0];

  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    return null;
  }

  await db
    .update(apiKey)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKey.id, keyRecord.id));

  return { user: userData };
}
