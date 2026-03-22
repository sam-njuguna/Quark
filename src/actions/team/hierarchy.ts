"use server";

import { db } from "@/db";
import { team, teamMember } from "@/db/schema/teams";
import { user } from "@/db/schema/auth-schema";
import { requireUser } from "@/actions/auth/session";
import { eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface MemberInfo {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

export interface TeamWithChildren {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  memberCount: number;
  members?: MemberInfo[];
  children: TeamWithChildren[];
}

export async function getOrgTree() {
  await requireUser();

  const allTeams = await db.select().from(team);
  const allMembers = await db
    .select({
      id: teamMember.id,
      teamId: teamMember.teamId,
      role: teamMember.role,
      userId: teamMember.userId,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(teamMember)
    .leftJoin(user, eq(teamMember.userId, user.id));

  const membersByTeam = new Map<string, MemberInfo[]>();
  for (const m of allMembers) {
    if (!membersByTeam.has(m.teamId)) {
      membersByTeam.set(m.teamId, []);
    }
    membersByTeam.get(m.teamId)!.push({
      id: m.userId,
      name: m.userName || m.userEmail || "Unknown",
      email: m.userEmail || "",
      image: m.userImage,
      role: m.role,
    });
  }

  const teamMap = new Map<string, TeamWithChildren>();
  for (const t of allTeams) {
    const members = membersByTeam.get(t.id) || [];
    teamMap.set(t.id, {
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      parentId: t.parentId,
      memberCount: members.length,
      members,
      children: [],
    });
  }

  const roots: TeamWithChildren[] = [];
  for (const [, node] of teamMap) {
    if (node.parentId && teamMap.has(node.parentId)) {
      teamMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getTeamAncestors(teamId: string): Promise<string[]> {
  await requireUser();

  const ancestors: string[] = [];
  let currentId: string | null = teamId;

  while (currentId) {
    const [t] = await db
      .select()
      .from(team)
      .where(eq(team.id, currentId))
      .limit(1);

    if (!t) break;
    ancestors.push(t.id);
    currentId = t.parentId ?? null;
  }

  return ancestors;
}

export async function getTeamDescendants(teamId: string): Promise<string[]> {
  await requireUser();

  const descendants: string[] = [];
  const queue = [teamId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await db
      .select({ id: team.id })
      .from(team)
      .where(eq(team.parentId, currentId));

    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
}

export async function updateTeamParent(
  teamId: string,
  parentId: string | null,
) {
  await requireUser();

  if (parentId === teamId) {
    throw new Error("Team cannot be its own parent");
  }

  if (parentId) {
    const descendants = await getTeamDescendants(teamId);
    if (descendants.includes(parentId)) {
      throw new Error("Cannot create circular reference");
    }
  }

  await db
    .update(team)
    .set({ parentId, updatedAt: new Date() })
    .where(eq(team.id, teamId));

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/hierarchy");
}

export async function getRootTeams() {
  await requireUser();

  const roots = await db.select().from(team).where(isNull(team.parentId));

  return roots;
}

export async function listAllTeamsFlat() {
  await requireUser();
  return db
    .select({
      id: team.id,
      name: team.name,
      slug: team.slug,
      parentId: team.parentId,
      description: team.description,
    })
    .from(team)
    .orderBy(team.name);
}
