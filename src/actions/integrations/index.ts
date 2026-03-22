"use server";

import { db } from "@/db";
import { integration } from "@/db/schema/integrations";
import { teamMember } from "@/db/schema/teams";
import { requireUser } from "@/actions/auth/session";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTeamIntegrations(teamId: string) {
  await requireUser();
  return db.select().from(integration).where(eq(integration.teamId, teamId));
}

export async function disconnectIntegration(integrationId: string) {
  const user = await requireUser();

  const [existing] = await db
    .select({ teamId: integration.teamId })
    .from(integration)
    .where(eq(integration.id, integrationId));

  if (!existing) throw new Error("Integration not found");

  const [membership] = await db
    .select()
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, existing.teamId),
        eq(teamMember.userId, user.id),
      ),
    );

  if (!membership || !["lead", "admin"].includes(membership.role)) {
    throw new Error("Insufficient permissions");
  }

  await db.delete(integration).where(eq(integration.id, integrationId));
  revalidatePath("/dashboard/integrations");
}

export async function getIntegrationByType(teamId: string, type: string) {
  await requireUser();
  const [row] = await db
    .select()
    .from(integration)
    .where(and(eq(integration.teamId, teamId), eq(integration.type, type)));
  return row ?? null;
}

export async function setGithubRepo(
  integrationId: string,
  repoFullName: string,
) {
  const user = await requireUser();

  const [existing] = await db
    .select({ teamId: integration.teamId, config: integration.config })
    .from(integration)
    .where(eq(integration.id, integrationId));

  if (!existing) throw new Error("Integration not found");

  const [membership] = await db
    .select()
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, existing.teamId),
        eq(teamMember.userId, user.id),
      ),
    );

  if (!membership || !["lead", "admin"].includes(membership.role)) {
    throw new Error("Insufficient permissions");
  }

  // Normalise: accept full URL or owner/repo
  const normalised = repoFullName
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/, "")
    .trim();

  await db
    .update(integration)
    .set({
      config: { ...(existing.config ?? {}), repo: normalised },
      updatedAt: new Date(),
    })
    .where(eq(integration.id, integrationId));

  revalidatePath("/dashboard/integrations");
}
