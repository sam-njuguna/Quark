"use server";

import { db } from "@/db";
import { webhook } from "@/db/schema/webhooks";
import { webhookLog } from "@/db/schema/webhook-logs";
import { requireUser } from "@/actions/auth/session";
import { getUserTeams } from "@/actions/auth/session";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function listWebhooks(teamId: string) {
  await requireUser();
  return db.select().from(webhook).where(eq(webhook.teamId, teamId));
}

export async function listWebhookLogs(webhookId: string, limit = 50) {
  await requireUser();
  return db
    .select()
    .from(webhookLog)
    .where(eq(webhookLog.webhookId, webhookId))
    .orderBy(webhookLog.createdAt)
    .limit(limit);
}

export async function createWebhook(
  teamId: string,
  url: string,
  events?: string[],
) {
  const user = await requireUser();

  const id = nanoid();
  const secret = `whsec_${nanoid(32)}`;

  const [created] = await db
    .insert(webhook)
    .values({
      id,
      teamId,
      createdBy: user.id,
      url,
      events: events ?? [
        "work.created",
        "work.stage_changed",
        "work.assigned",
        "work.completed",
        "work.blocked",
        "work.cancelled",
      ],
      secret,
      isActive: true,
    })
    .returning();

  return created;
}

export async function deleteWebhook(webhookId: string) {
  const user = await requireUser();
  const teams = await getUserTeams(user.id);
  const teamIds = teams.map((t) => t.id);

  const [wh] = await db.select().from(webhook).where(eq(webhook.id, webhookId));
  if (!wh || !teamIds.includes(wh.teamId)) throw new Error("Not found");

  await db.delete(webhook).where(eq(webhook.id, webhookId));
}

export async function toggleWebhook(webhookId: string, isActive: boolean) {
  const user = await requireUser();
  const teams = await getUserTeams(user.id);
  const teamIds = teams.map((t) => t.id);

  const [wh] = await db.select().from(webhook).where(eq(webhook.id, webhookId));
  if (!wh || !teamIds.includes(wh.teamId)) throw new Error("Not found");

  await db.update(webhook).set({ isActive }).where(eq(webhook.id, webhookId));
}

async function hmacSign(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(body);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, msgData);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function deliverWithRetry(
  h: { id: string; url: string; secret: string | null },
  body: string,
  attempt = 0,
): Promise<number> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (h.secret) {
    const sig = await hmacSign(h.secret, body);
    headers["X-Quark-Signature"] = `sha256=${sig}`;
  }
  try {
    const res = await fetch(h.url, { method: "POST", headers, body });
    if (!res.ok && attempt < 3) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      return deliverWithRetry(h, body, attempt + 1);
    }
    return res.status;
  } catch {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      return deliverWithRetry(h, body, attempt + 1);
    }
    return 0;
  }
}

export async function triggerWebhooks(
  teamId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  const hooks = await db
    .select()
    .from(webhook)
    .where(and(eq(webhook.teamId, teamId), eq(webhook.isActive, true)));

  await Promise.allSettled(
    hooks
      .filter((h) => (h.events as string[]).includes(event))
      .map(async (h) => {
        const body = JSON.stringify({
          event,
          payload,
          timestamp: new Date().toISOString(),
        });
        const start = Date.now();
        const status = await deliverWithRetry(h, body);
        const ms = Date.now() - start;
        await db
          .update(webhook)
          .set({
            lastTriggeredAt: new Date(),
            lastStatusCode: String(status),
          })
          .where(eq(webhook.id, h.id));
        await db
          .insert(webhookLog)
          .values({
            id: nanoid(),
            webhookId: h.id,
            event,
            statusCode: status,
            responseMs: ms,
          })
          .catch(() => {});
      }),
  );
}
