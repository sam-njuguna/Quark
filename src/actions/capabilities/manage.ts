"use server";

import { requireUser } from "@/actions/auth/session";
import { getUserCapabilities, hasCapability, grantUserCapability, denyUserCapability } from "@/lib/capabilities";
import type { CapabilityId } from "@/db/schema/capabilities";
import { z } from "zod";

export async function getMyCapabilities(teamId?: string | null) {
  const user = await requireUser();
  return getUserCapabilities(user.id, teamId);
}

export async function checkMyCapability(capability: string, teamId?: string | null) {
  const user = await requireUser();
  return hasCapability(user.id, capability as CapabilityId, teamId);
}

const grantSchema = z.object({
  targetUserId: z.string(),
  capability: z.string(),
  teamId: z.string().optional(),
});

export async function grantCapability(rawInput: unknown) {
  const user = await requireUser();
  const input = grantSchema.parse(rawInput);

  const has = await hasCapability(user.id, "admin:users" as CapabilityId, input.teamId ?? null);
  if (!has) throw new Error("Not authorized to grant capabilities");

  await grantUserCapability(input.targetUserId, input.capability as CapabilityId, input.teamId ?? null);
  return { success: true };
}

const denySchema = z.object({
  targetUserId: z.string(),
  capability: z.string(),
  teamId: z.string().optional(),
});

export async function denyCapability(rawInput: unknown) {
  const user = await requireUser();
  const input = denySchema.parse(rawInput);

  const has = await hasCapability(user.id, "admin:users" as CapabilityId, input.teamId ?? null);
  if (!has) throw new Error("Not authorized to deny capabilities");

  await denyUserCapability(input.targetUserId, input.capability as CapabilityId, input.teamId ?? null);
  return { success: true };
}
