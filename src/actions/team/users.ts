"use server";

import { db } from "@/db";
import { teamMember } from "@/db/schema/teams";
import { user } from "@/db/schema/auth-schema";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";

export async function listAllUsers() {
  await requireUser();

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: teamMember.role,
      teamId: teamMember.teamId,
    })
    .from(user)
    .innerJoin(teamMember, eq(teamMember.userId, user.id));

  // A user can be a member of multiple teams — deduplicate by user id,
  // keeping the first membership row (role/teamId from primary team).
  const seen = new Map<string, (typeof rows)[0]>();
  for (const row of rows) {
    if (!seen.has(row.id)) seen.set(row.id, row);
  }
  return Array.from(seen.values());
}
