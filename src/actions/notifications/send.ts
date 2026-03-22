"use server";

import { Resend } from "resend";
import { render } from "@react-email/components";
import WorkNotificationEmail from "@/emails/work-notification";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { work } from "@/db/schema/work";
import { eq } from "drizzle-orm";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export type NotificationType =
  | "work_assigned"
  | "work_submitted"
  | "work_approved"
  | "work_rejected"
  | "work_blocked"
  | "work_unblocked"
  | "work_reassigned";

interface NotificationData {
  workId: string;
  recipientId: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
}

const notificationConfig: Record<
  NotificationType,
  {
    action: string;
    description: (workTitle: string, actorName?: string) => string;
  }
> = {
  work_assigned: {
    action: "Work Assigned",
    description: (workTitle, actorName) =>
      `You have been assigned to "${workTitle}"${actorName ? ` by ${actorName}` : ""}.`,
  },
  work_submitted: {
    action: "Work Submitted",
    description: (workTitle, actorName) =>
      `"${workTitle}" has been submitted for review${actorName ? ` by ${actorName}` : ""}.`,
  },
  work_approved: {
    action: "Work Approved",
    description: (workTitle) =>
      `Your work on "${workTitle}" has been approved!`,
  },
  work_rejected: {
    action: "Revision Requested",
    description: (workTitle) =>
      `Changes have been requested for "${workTitle}". Please review the feedback.`,
  },
  work_blocked: {
    action: "Work Blocked",
    description: (workTitle) =>
      `"${workTitle}" has been blocked. Check the reason and address the issue.`,
  },
  work_unblocked: {
    action: "Work Unblocked",
    description: (workTitle) =>
      `"${workTitle}" is no longer blocked. You can continue working on it.`,
  },
  work_reassigned: {
    action: "Work Reassigned",
    description: (workTitle, actorName) =>
      `"${workTitle}" has been reassigned${actorName ? ` by ${actorName}` : ""}.`,
  },
};

async function getUserEmail(userId: string) {
  const [result] = await db
    .select({
      email: user.email,
      name: user.name,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return result;
}

async function getWorkDetails(workId: string) {
  const [result] = await db
    .select({
      title: work.title,
      type: work.type,
    })
    .from(work)
    .where(eq(work.id, workId))
    .limit(1);

  return result;
}

async function sendEmailNotification({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set - skipping email send");
    console.info(`Email for ${to}: ${subject}`);
    return { id: "dev-mode" };
  }

  try {
    const html = await render(react, { pretty: false });

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Quark <quark@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email");
    }

    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export async function sendNotification(data: NotificationData) {
  const { workId, recipientId, type, metadata } = data;

  const [recipient, workDetails] = await Promise.all([
    getUserEmail(recipientId),
    getWorkDetails(workId),
  ]);

  if (!recipient || !workDetails) {
    console.warn("Could not find recipient or work for notification");
    return;
  }

  if (!recipient.email) {
    console.warn("Recipient has no email address");
    return;
  }

  const config = notificationConfig[type];
  const workUrl = `${APP_URL}/dashboard/work/${workId}`;

  const recipientName = recipient.name || "there";
  const actorName = metadata?.actorName as string | undefined;

  const emailReact = WorkNotificationEmail({
    recipientName,
    workTitle: workDetails.title,
    workType: workDetails.type,
    action: config.action,
    actionDescription: config.description(workDetails.title, actorName),
    workUrl,
  });

  return sendEmailNotification({
    to: recipient.email,
    subject: `Quark: ${config.action} - ${workDetails.title}`,
    react: emailReact,
  });
}

export async function notifyWorkAssigned(
  workId: string,
  recipientId: string,
  actorName?: string,
) {
  return sendNotification({
    workId,
    recipientId,
    type: "work_assigned",
    metadata: { actorName },
  });
}

export async function notifyWorkSubmitted(
  workId: string,
  recipientId: string,
  actorName?: string,
) {
  return sendNotification({
    workId,
    recipientId,
    type: "work_submitted",
    metadata: { actorName },
  });
}

export async function notifyWorkApproved(workId: string, recipientId: string) {
  return sendNotification({
    workId,
    recipientId,
    type: "work_approved",
  });
}

export async function notifyWorkRejected(workId: string, recipientId: string) {
  return sendNotification({
    workId,
    recipientId,
    type: "work_rejected",
  });
}

export async function notifyWorkBlocked(workId: string, recipientId: string) {
  return sendNotification({
    workId,
    recipientId,
    type: "work_blocked",
  });
}

export async function notifyWorkUnblocked(workId: string, recipientId: string) {
  return sendNotification({
    workId,
    recipientId,
    type: "work_unblocked",
  });
}

export async function notifyWorkReassigned(
  workId: string,
  recipientId: string,
  actorName?: string,
) {
  return sendNotification({
    workId,
    recipientId,
    type: "work_reassigned",
    metadata: { actorName },
  });
}
