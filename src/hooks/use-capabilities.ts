"use client";

import { useEffect, useState, useTransition } from "react";
import { getMyCapabilities } from "@/actions/capabilities";

interface UserCapabilities {
  userId: string;
  teamId: string | null;
  capabilities: Record<string, boolean>;
}

export function useCapabilities(teamId?: string | null) {
  const [caps, setCaps] = useState<UserCapabilities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyCapabilities(teamId);
        setCaps(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [teamId]);

  const has = (capability: string) => {
    return caps?.capabilities[capability] ?? false;
  };

  return { capabilities: caps, has, loading };
}
