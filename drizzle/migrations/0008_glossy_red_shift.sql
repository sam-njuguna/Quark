CREATE TABLE "user_notification_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email_work_assigned" boolean DEFAULT true NOT NULL,
	"email_work_submitted" boolean DEFAULT true NOT NULL,
	"email_work_approved" boolean DEFAULT true NOT NULL,
	"email_revision_requested" boolean DEFAULT true NOT NULL,
	"email_work_blocked" boolean DEFAULT false NOT NULL,
	"email_mention_in_comment" boolean DEFAULT true NOT NULL,
	"email_daily_digest" boolean DEFAULT false NOT NULL,
	"email_mute_all" boolean DEFAULT false NOT NULL,
	"inapp_work_assigned" boolean DEFAULT true NOT NULL,
	"inapp_work_review" boolean DEFAULT true NOT NULL,
	"inapp_work_blocked" boolean DEFAULT true NOT NULL,
	"inapp_new_comments" boolean DEFAULT true NOT NULL,
	"inapp_work_cancelled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;