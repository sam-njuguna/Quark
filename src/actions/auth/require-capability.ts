"use server";

import { getSession } from "@/actions/auth/session";
import { getUserCapabilities } from "@/lib/capabilities";
import type { CapabilityId } from "@/db/schema/capabilities";

let capabilitiesCache: Record<string, { caps: any; expires: number }> = {};

export async function requireCapability(capability: CapabilityId, teamId?: string | null): Promise<void> {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const cacheKey = `${session.user.id}-${teamId ?? "global"}`;
  const cached = capabilitiesCache[cacheKey];

  if (cached && cached.expires > Date.now()) {
    if (!cached.caps.capabilities[capability]) {
      throw new Error(`Missing capability: ${capability}`);
    }
    return;
  }

  const caps = await getUserCapabilities(session.user.id, teamId);
  
  capabilitiesCache[cacheKey] = {
    caps,
    expires: Date.now() + 60 * 1000,
  };

  if (!caps.capabilities[capability]) {
    throw new Error(`Missing capability: ${capability}`);
  }
}

export async function clearCapabilitiesCache(userId?: string) {
  if (userId) {
    Object.keys(capabilitiesCache).forEach((key) => {
      if (key.startsWith(userId)) {
        delete capabilitiesCache[key];
      }
    });
  } else {
    capabilitiesCache = {};
  }
}
