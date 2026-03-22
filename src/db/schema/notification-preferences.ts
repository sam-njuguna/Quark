import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const userNotificationPreferences = pgTable(
  "user_notification_preferences",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),

    // Email notifications
    emailWorkAssigned: boolean("email_work_assigned").notNull().default(true),
    emailWorkSubmitted: boolean("email_work_submitted").notNull().default(true),
    emailWorkApproved: boolean("email_work_approved").notNull().default(true),
    emailRevisionRequested: boolean("email_revision_requested").notNull().default(true),
    emailWorkBlocked: boolean("email_work_blocked").notNull().default(false),
    emailMentionInComment: boolean("email_mention_in_comment").notNull().default(true),
    emailDailyDigest: boolean("email_daily_digest").notNull().default(false),
    emailMuteAll: boolean("email_mute_all").notNull().default(false),

    // In-app notifications
    inappWorkAssigned: boolean("inapp_work_assigned").notNull().default(true),
    inappWorkReview: boolean("inapp_work_review").notNull().default(true),
    inappWorkBlocked: boolean("inapp_work_blocked").notNull().default(true),
    inappNewComments: boolean("inapp_new_comments").notNull().default(true),
    inappWorkCancelled: boolean("inapp_work_cancelled").notNull().default(false),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);
