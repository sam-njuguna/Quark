"use server";

import { db } from "@/db";
import { userCapabilities, roleCapabilities, capabilityDefinitions } from "@/db/schema/capabilities";
import type { CapabilityId } from "@/db/schema/capabilities";
import { teamMember } from "@/db/schema/teams";
import { user } from "@/db/schema/auth-schema";
import { eq, and, inArray } from "drizzle-orm";

export interface UserCapabilities {
  userId: string;
  teamId: string | null;
  capabilities: Record<string, boolean>;
}

const ROLE_DEFAULT_CAPABILITIES: Record<string, string[]> = {
  admin: [
    "work:create", "work:read", "work:update", "work:delete", "work:assign",
    "team:manage", "team:settings",
    "admin:view", "admin:users",
    "mcp:use", "api:keys",
    "integrations:github", "integrations:calendar",
    "analytics:view", "audit:view",
  ],
  lead: [
    "work:create", "work:read", "work:update", "work:assign",
    "team:manage",
    "mcp:use",
    "integrations:github", "integrations:calendar",
    "analytics:view",
  ],
  member: [
    "work:create", "work:read", "work:update",
    "mcp:use",
    "analytics:view",
  ],
};

export async function getUserCapabilities(
  userId: string,
  teamId?: string | null
): Promise<UserCapabilities> {
  const allCapabilities: Record<string, boolean> = {};

  capabilityDefinitions.forEach((cap) => {
    allCapabilities[cap.id] = false;
  });

  const roleCaps = await db
    .select()
    .from(roleCapabilities)
    .where(teamId ? eq(roleCapabilities.teamId, teamId) : undefined);

  const userCaps = await db
    .select()
    .from(userCapabilities)
    .where(
      teamId
        ? and(eq(userCapabilities.userId, userId), eq(userCapabilities.teamId, teamId))
        : eq(userCapabilities.userId, userId)
    );

  const userTeamRoles = await db
    .select()
    .from(teamMember)
    .where(eq(teamMember.userId, userId));

  const roleMap: Record<string, string> = {};
  userTeamRoles.forEach((m) => {
    roleMap[m.teamId] = m.role;
  });

  const effectiveTeamId = teamId ?? userTeamRoles[0]?.teamId;
  const userRole = effectiveTeamId ? roleMap[effectiveTeamId] : null;

  capabilityDefinitions.forEach((cap) => {
    const roleCap = roleCaps.find((rc) => rc.capability === cap.id);
    const userCap = userCaps.find((uc) => uc.capability === cap.id);

    let granted = false;

    if (roleCap) {
      const roleDefault = ROLE_DEFAULT_CAPABILITIES[userRole ?? "member"] ?? [];
      granted = roleDefault.includes(cap.id);
      if (roleCap.granted.length > 0) {
        granted = roleCap.granted.includes(userId);
      }
      if (roleCap.denied.includes(userId)) {
        granted = false;
      }
    } else {
      const roleDefault = ROLE_DEFAULT_CAPABILITIES[userRole ?? "member"] ?? [];
      granted = roleDefault.includes(cap.id);
    }

    if (userCap) {
      if (userCap.granted.includes(userId)) {
        granted = true;
      }
      if (userCap.denied.includes(userId)) {
        granted = false;
      }
    }

    allCapabilities[cap.id] = granted;
  });

  return {
    userId,
    teamId: effectiveTeamId ?? null,
    capabilities: allCapabilities,
  };
}

export async function hasCapability(
  userId: string,
  capability: CapabilityId,
  teamId?: string | null
): Promise<boolean> {
  const caps = await getUserCapabilities(userId, teamId);
  return caps.capabilities[capability] ?? false;
}

export async function grantUserCapability(
  userId: string,
  capability: CapabilityId,
  teamId?: string | null,
  grantedTo?: string[]
) {
  const existing = await db
    .select()
    .from(userCapabilities)
    .where(
      and(
        eq(userCapabilities.userId, userId),
        capability ? eq(userCapabilities.capability, capability) : undefined,
        teamId ? eq(userCapabilities.teamId, teamId) : undefined
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userCapabilities)
      .set({
        granted: [...new Set([...existing[0].granted, ...(grantedTo ?? [])])],
      })
      .where(eq(userCapabilities.id, existing[0].id));
  } else {
    await db.insert(userCapabilities).values({
      id: `${userId}-${capability}-${teamId ?? "global"}`,
      userId,
      teamId: teamId ?? null,
      capability,
      granted: grantedTo ?? [],
      denied: [],
    });
  }
}

export async function denyUserCapability(
  userId: string,
  capability: CapabilityId,
  teamId?: string | null,
  deniedTo?: string[]
) {
  const existing = await db
    .select()
    .from(userCapabilities)
    .where(
      and(
        eq(userCapabilities.userId, userId),
        capability ? eq(userCapabilities.capability, capability) : undefined,
        teamId ? eq(userCapabilities.teamId, teamId) : undefined
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userCapabilities)
      .set({
        denied: [...new Set([...existing[0].denied, ...(deniedTo ?? [])])],
      })
      .where(eq(userCapabilities.id, existing[0].id));
  } else {
    await db.insert(userCapabilities).values({
      id: `${userId}-${capability}-${teamId ?? "global"}`,
      userId,
      teamId: teamId ?? null,
      capability,
      granted: [],
      denied: deniedTo ?? [],
    });
  }
}

export async function getCapabilityDefinitions() {
  return capabilityDefinitions;
}
