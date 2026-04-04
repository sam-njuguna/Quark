"use server";

import { db } from "@/db";
import { work } from "@/db/schema/work";
import { requireUser, isPrivilegedUser, getSystemRole } from "@/actions/auth/session";
import { eq, and, desc, inArray } from "drizzle-orm";
import { teamMember, team } from "@/db/schema/teams";

interface ListWorkOptions {
  stage?: string;
  assignedTo?: string;
  createdBy?: string;
  type?: string;
  teamId?: string;
  limit?: number;
  offset?: number;
}

export async function listWork(options: ListWorkOptions = {}) {
  await requireUser();
  const {
    stage,
    assignedTo,
    createdBy,
    type,
    teamId,
    limit = 20,
    offset = 0,
  } = options;

  const conditions = [];

  if (stage) {
    conditions.push(eq(work.stage, stage));
  }
  if (assignedTo) {
    conditions.push(eq(work.assignedTo, assignedTo));
  }
  if (createdBy) {
    conditions.push(eq(work.createdBy, createdBy));
  }
  if (type) {
    conditions.push(eq(work.type, type));
  }
  if (teamId) {
    conditions.push(eq(work.teamId, teamId));
  }

  const results = await db
    .select()
    .from(work)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(work.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}

export async function listMyWork() {
  const user = await requireUser();
  return listWork({ assignedTo: user.id });
}

export async function listTeamWork(teamId: string) {
  const user = await requireUser();

  // Verify user is a team member
  const membership = await db
    .select()
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, user.id)))
    .limit(1);

  if (membership.length === 0) {
    throw new Error("Not authorized to view team work");
  }

  return listWork({ teamId });
}

export async function listCreatedWork() {
  const user = await requireUser();
  return listWork({ createdBy: user.id });
}

export async function listAllTeamsWork(
  options: Omit<ListWorkOptions, "teamId"> = {},
) {
  const currentUser = await requireUser();
  const privileged = await isPrivilegedUser(currentUser.id);
  if (!privileged) throw new Error("Insufficient permissions");

  const {
    stage,
    assignedTo,
    createdBy,
    type,
    limit = 200,
    offset = 0,
  } = options;
  const conditions = [];

  if (stage) conditions.push(eq(work.stage, stage));
  if (assignedTo) conditions.push(eq(work.assignedTo, assignedTo));
  if (createdBy) conditions.push(eq(work.createdBy, createdBy));
  if (type) conditions.push(eq(work.type, type));

  const results = await db
    .select({
      id: work.id,
      title: work.title,
      type: work.type,
      description: work.description,
      instructions: work.instructions,
      stage: work.stage,
      priority: work.priority,
      assignedTo: work.assignedTo,
      claimedBy: work.claimedBy,
      parentId: work.parentId,
      teamId: work.teamId,
      teamName: team.name,
      createdBy: work.createdBy,
      dueDate: work.dueDate,
      blockedReason: work.blockedReason,
      completedAt: work.completedAt,
      submittedAt: work.submittedAt,
      createdAt: work.createdAt,
      updatedAt: work.updatedAt,
      githubRepo: work.githubRepo,
      githubIssueUrl: work.githubIssueUrl,
      meetingUrl: work.meetingUrl,
      successCriteria: work.successCriteria,
      embedding: work.embedding,
      aiAgentId: work.aiAgentId,
      aiStatus: work.aiStatus,
      aiCustomInstructions: work.aiCustomInstructions,
      aiStartedAt: work.aiStartedAt,
      aiCompletedAt: work.aiCompletedAt,
      aiError: work.aiError,
      aiProgress: work.aiProgress,
    })
    .from(work)
    .leftJoin(team, eq(work.teamId, team.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(work.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}

export async function getMyTeamWork(
  options: Omit<ListWorkOptions, "teamId"> = {},
) {
  const currentUser = await requireUser();

  const memberships = await db
    .select({ teamId: teamMember.teamId })
    .from(teamMember)
    .where(eq(teamMember.userId, currentUser.id));

  if (memberships.length === 0) return [];

  const teamIds = memberships.map((m) => m.teamId);
  return listWork({ ...options, teamId: teamIds[0] });
}

/**
 * List work items based on user's role and team memberships.
 * - Super admins: See all work across all teams
 * - Team members: See work from teams they are a member of
 */
export async function listAccessibleWork(
  options: Omit<ListWorkOptions, "teamId"> = {},
) {
  const currentUser = await requireUser();

  // Check if super admin - can see all work
  const systemRole = await getSystemRole(currentUser.id);
  if (systemRole === "super_admin") {
    return listAllTeamsWork(options);
  }

  // Get user's team memberships
  const memberships = await db
    .select({ teamId: teamMember.teamId, role: teamMember.role })
    .from(teamMember)
    .where(eq(teamMember.userId, currentUser.id));

  if (memberships.length === 0) return [];

  // Collect team IDs user has access to (all teams they're a member of)
  const teamIds = memberships.map((m) => m.teamId);

  const {
    stage,
    assignedTo,
    createdBy,
    type,
    limit = 200,
    offset = 0,
  } = options;
  const conditions = [inArray(work.teamId, teamIds)];

  if (stage) conditions.push(eq(work.stage, stage));
  if (assignedTo) conditions.push(eq(work.assignedTo, assignedTo));
  if (createdBy) conditions.push(eq(work.createdBy, createdBy));
  if (type) conditions.push(eq(work.type, type));

  // Join with team to get team name
  const results = await db
    .select({
      id: work.id,
      title: work.title,
      type: work.type,
      description: work.description,
      instructions: work.instructions,
      stage: work.stage,
      priority: work.priority,
      assignedTo: work.assignedTo,
      claimedBy: work.claimedBy,
      parentId: work.parentId,
      teamId: work.teamId,
      teamName: team.name,
      createdBy: work.createdBy,
      dueDate: work.dueDate,
      blockedReason: work.blockedReason,
      completedAt: work.completedAt,
      submittedAt: work.submittedAt,
      createdAt: work.createdAt,
      updatedAt: work.updatedAt,
      githubRepo: work.githubRepo,
      githubIssueUrl: work.githubIssueUrl,
      meetingUrl: work.meetingUrl,
      successCriteria: work.successCriteria,
      embedding: work.embedding,
      aiAgentId: work.aiAgentId,
      aiStatus: work.aiStatus,
      aiCustomInstructions: work.aiCustomInstructions,
      aiStartedAt: work.aiStartedAt,
      aiCompletedAt: work.aiCompletedAt,
      aiError: work.aiError,
      aiProgress: work.aiProgress,
    })
    .from(work)
    .leftJoin(team, eq(work.teamId, team.id))
    .where(and(...conditions))
    .orderBy(desc(work.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}
