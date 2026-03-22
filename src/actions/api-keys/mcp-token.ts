"use server";

import { db } from "@/db";
import { apiKey } from "@/db/schema/api-key";
import { requireUser } from "@/actions/auth/session";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

function generateKey(): string {
  return `qkp_${nanoid(32)}`;
}

export async function getOrCreateMcpToken() {
  const user = await requireUser();

  const existing = await db
    .select()
    .from(apiKey)
    .where(and(eq(apiKey.userId, user.id), eq(apiKey.name, "MCP Token")))
    .limit(1);

  if (existing.length > 0) {
    return {
      id: existing[0].id,
      key: existing[0].key,
      createdAt: existing[0].createdAt,
      expiresAt: existing[0].expiresAt,
    };
  }

  const key = generateKey();
  const [newKey] = await db
    .insert(apiKey)
    .values({
      id: nanoid(),
      userId: user.id,
      key,
      name: "MCP Token",
    })
    .returning();

  return {
    id: newKey.id,
    key: newKey.key,
    createdAt: newKey.createdAt,
    expiresAt: newKey.expiresAt,
  };
}

export async function regenerateMcpToken() {
  const user = await requireUser();

  await db
    .delete(apiKey)
    .where(and(eq(apiKey.userId, user.id), eq(apiKey.name, "MCP Token")));

  return getOrCreateMcpToken();
}

export async function getMcpTokenPreview() {
  const user = await requireUser();

  const existing = await db
    .select()
    .from(apiKey)
    .where(and(eq(apiKey.userId, user.id), eq(apiKey.name, "MCP Token")))
    .limit(1);

  if (existing.length === 0) {
    return null;
  }

  const key = existing[0].key;
  return {
    hasToken: true,
    preview: `${key.slice(0, 8)}...${key.slice(-4)}`,
    keyId: existing[0].id,
    createdAt: existing[0].createdAt,
  };
}
