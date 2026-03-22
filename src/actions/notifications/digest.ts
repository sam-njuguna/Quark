"use server";

import { db } from "@/db";
import { activity } from "@/db/schema/activity";
import { work } from "@/db/schema/work";
import { user as userTable } from "@/db/schema/auth-schema";
import { requireUser } from "@/actions/auth/session";
import { eq, gt, and, desc } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendActivityDigest(targetUserId: string) {
  await requireUser();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [recipient] = await db
    .select({ name: userTable.name, email: userTable.email })
    .from(userTable)
    .where(eq(userTable.id, targetUserId));

  if (!recipient) throw new Error("User not found");

  const activities = await db
    .select({
      action: activity.action,
      createdAt: activity.createdAt,
      workTitle: work.title,
      workId: work.id,
    })
    .from(activity)
    .innerJoin(work, eq(work.id, activity.workId))
    .where(and(eq(activity.userId, targetUserId), gt(activity.createdAt, since)))
    .orderBy(desc(activity.createdAt))
    .limit(20);

  if (activities.length === 0) return { sent: false, reason: "No recent activity" };

  const lines = activities
    .map((a) => `• ${a.action.replace(/_/g, " ")} — ${a.workTitle}`)
    .join("\n");

  await resend.emails.send({
    from: "Quark <noreply@quark.app>",
    to: recipient.email,
    subject: `Your Quark activity digest — ${new Date().toLocaleDateString()}`,
    text: `Hi ${recipient.name ?? "there"},\n\nHere's your activity summary for the last 24 hours:\n\n${lines}\n\nView your work at ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\n— Quark`,
  });

  return { sent: true, count: activities.length };
}
