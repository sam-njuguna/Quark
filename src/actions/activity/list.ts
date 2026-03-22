"use server";

import { db } from "@/db";
import { activity } from "@/db/schema/activity";
import { work } from "@/db/schema/work";
import { user } from "@/db/schema/auth-schema";
import { teamMember } from "@/db/schema/teams";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import { requireUser } from "@/actions/auth/session";

interface ListActivityOptions {
  workId?: string;
  limit?: number;
}

export async function listActivity(options: ListActivityOptions = {}) {
  const { workId, limit = 50 } = options;

  const conditions = [];
  if (workId) {
    conditions.push(eq(activity.workId, workId));
  }

  const results = await db
    .select({
      id: activity.id,
      workId: activity.workId,
      action: activity.action,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      work: {
        id: work.id,
        title: work.title,
        type: work.type,
      },
    })
    .from(activity)
    .leftJoin(user, eq(activity.userId, user.id))
    .leftJoin(work, eq(activity.workId, work.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(activity.createdAt))
    .limit(limit);

  return results;
}

export async function listMyActivity(limit = 20) {
  const currentUser = await requireUser();

  // Get user's team memberships
  const memberships = await db
    .select({ teamId: teamMember.teamId })
    .from(teamMember)
    .where(eq(teamMember.userId, currentUser.id));

  if (memberships.length === 0) {
    // If no teams, only show activities for work assigned to or created by user
    const results = await db
      .select({
        id: activity.id,
        workId: activity.workId,
        action: activity.action,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        work: {
          id: work.id,
          title: work.title,
          type: work.type,
        },
      })
      .from(activity)
      .leftJoin(user, eq(activity.userId, user.id))
      .leftJoin(work, eq(activity.workId, work.id))
      .where(
        or(
          eq(work.assignedTo, currentUser.id),
          eq(work.createdBy, currentUser.id),
          eq(activity.userId, currentUser.id),
        ),
      )
      .orderBy(desc(activity.createdAt))
      .limit(limit);

    return results;
  }

  // Filter activities by user's teams
  const teamIds = memberships.map((m) => m.teamId);

  const results = await db
    .select({
      id: activity.id,
      workId: activity.workId,
      action: activity.action,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      work: {
        id: work.id,
        title: work.title,
        type: work.type,
      },
    })
    .from(activity)
    .leftJoin(user, eq(activity.userId, user.id))
    .leftJoin(work, eq(activity.workId, work.id))
    .where(inArray(work.teamId, teamIds))
    .orderBy(desc(activity.createdAt))
    .limit(limit);

  return results;
}
