"use server";

import { db } from "@/db";
import { team } from "@/db/schema/teams";
import { requireUser, getSystemRole } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTeamToolPolicy(teamId: string): Promise<string[]> {
  await requireUser();
  const [row] = await db
    .select({ toolPolicy: team.toolPolicy })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);
  const policy = row?.toolPolicy as { blockedTools?: string[] } | null;
  return policy?.blockedTools ?? [];
}

export async function setTeamToolPolicy(
  teamId: string,
  blockedTools: string[],
) {
  const currentUser = await requireUser();
  const callerRole = await getSystemRole(currentUser.id);
  if (callerRole !== "super_admin") {
    throw new Error("Only super admins can set team tool policy");
  }

  await db
    .update(team)
    .set({ toolPolicy: { blockedTools } })
    .where(eq(team.id, teamId));

  revalidatePath("/dashboard/settings");
}
