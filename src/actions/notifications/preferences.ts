"use server";

import { db } from "@/db";
import { userNotificationPreferences } from "@/db/schema/notification-preferences";
import { requireUser } from "@/actions/auth/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type NotificationPreferences = Omit<
  typeof userNotificationPreferences.$inferSelect,
  "userId" | "updatedAt"
>;

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const user = await requireUser();

  const [existing] = await db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, user.id));

  if (existing) {
    return {
      emailWorkAssigned: existing.emailWorkAssigned,
      emailWorkSubmitted: existing.emailWorkSubmitted,
      emailWorkApproved: existing.emailWorkApproved,
      emailRevisionRequested: existing.emailRevisionRequested,
      emailWorkBlocked: existing.emailWorkBlocked,
      emailMentionInComment: existing.emailMentionInComment,
      emailDailyDigest: existing.emailDailyDigest,
      emailMuteAll: existing.emailMuteAll,
      inappWorkAssigned: existing.inappWorkAssigned,
      inappWorkReview: existing.inappWorkReview,
      inappWorkBlocked: existing.inappWorkBlocked,
      inappNewComments: existing.inappNewComments,
      inappWorkCancelled: existing.inappWorkCancelled,
    };
  }

  // Return defaults without inserting (lazy init on first save)
  return {
    emailWorkAssigned: true,
    emailWorkSubmitted: true,
    emailWorkApproved: true,
    emailRevisionRequested: true,
    emailWorkBlocked: false,
    emailMentionInComment: true,
    emailDailyDigest: false,
    emailMuteAll: false,
    inappWorkAssigned: true,
    inappWorkReview: true,
    inappWorkBlocked: true,
    inappNewComments: true,
    inappWorkCancelled: false,
  };
}

export async function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>,
) {
  const user = await requireUser();

  await db
    .insert(userNotificationPreferences)
    .values({ userId: user.id, ...prefs, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userNotificationPreferences.userId,
      set: { ...prefs, updatedAt: new Date() },
    });

  revalidatePath("/dashboard/settings");
}
