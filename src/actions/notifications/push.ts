"use server";

import { db } from "@/db";
import { pushSubscription } from "@/db/schema";
import { requireUser } from "@/actions/auth/session";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function subscribeToPush(data: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const user = await requireUser();

  const existing = await db
    .select()
    .from(pushSubscription)
    .where(and(eq(pushSubscription.userId, user.id), eq(pushSubscription.endpoint, data.endpoint)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(pushSubscription)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(pushSubscription.id, existing[0].id));
    return existing[0].id;
  }

  const id = nanoid();
  await db.insert(pushSubscription).values({
    id,
    userId: user.id,
    endpoint: data.endpoint,
    keys: JSON.stringify(data.keys),
    isActive: true,
  });

  return id;
}

export async function unsubscribeFromPush(endpoint: string) {
  const user = await requireUser();

  await db
    .update(pushSubscription)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(pushSubscription.userId, user.id),
        eq(pushSubscription.endpoint, endpoint),
      ),
    );
}

export async function getUserPushSubscriptions() {
  const user = await requireUser();

  const subscriptions = await db
    .select()
    .from(pushSubscription)
    .where(and(eq(pushSubscription.userId, user.id), eq(pushSubscription.isActive, true)));

  return subscriptions.map((sub) => ({
    id: sub.id,
    endpoint: sub.endpoint,
    keys: JSON.parse(sub.keys),
  }));
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const subscriptions = await db
    .select()
    .from(pushSubscription)
    .where(
      and(eq(pushSubscription.userId, userId), eq(pushSubscription.isActive, true)),
    );

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured - push notifications disabled");
    return { sent: 0, failed: subscriptions.length };
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      const payload = JSON.stringify({
        notification: {
          title,
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
          data,
          vibrate: [100, 50, 100],
          actions: [
            { action: "open", title: "Open" },
            { action: "dismiss", title: "Dismiss" },
          ],
        },
      });

      const response = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "TTL": "86400",
        },
        body: payload,
      });

      if (response.ok) {
        sent++;
      } else if (response.status === 410) {
        await db
          .update(pushSubscription)
          .set({ isActive: false })
          .where(eq(pushSubscription.id, sub.id));
        failed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error("Failed to send push notification:", error);
      failed++;
    }
  }

  return { sent, failed };
}
