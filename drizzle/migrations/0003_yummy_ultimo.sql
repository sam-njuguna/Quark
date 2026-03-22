CREATE TABLE "work_dependency" (
	"id" text PRIMARY KEY NOT NULL,
	"work_id" text NOT NULL,
	"depends_on_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reaction" (
	"id" text PRIMARY KEY NOT NULL,
	"work_id" text NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_automation" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"created_by" text NOT NULL,
	"name" text NOT NULL,
	"trigger_stage" text NOT NULL,
	"action" text NOT NULL,
	"action_config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_log" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"event" text NOT NULL,
	"status_code" integer,
	"response_ms" integer,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "work_dependency" ADD CONSTRAINT "work_dependency_work_id_work_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_dependency" ADD CONSTRAINT "work_dependency_depends_on_id_work_id_fk" FOREIGN KEY ("depends_on_id") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_work_id_work_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_automation" ADD CONSTRAINT "stage_automation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_automation" ADD CONSTRAINT "stage_automation_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_log" ADD CONSTRAINT "webhook_log_webhook_id_webhook_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "work_dep_workId_idx" ON "work_dependency" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "work_dep_dependsOnId_idx" ON "work_dependency" USING btree ("depends_on_id");--> statement-breakpoint
CREATE INDEX "reaction_workId_idx" ON "reaction" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "reaction_userId_idx" ON "reaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stage_auto_teamId_idx" ON "stage_automation" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "stage_auto_triggerStage_idx" ON "stage_automation" USING btree ("trigger_stage");--> statement-breakpoint
CREATE INDEX "webhook_log_webhookId_idx" ON "webhook_log" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "webhook_log_createdAt_idx" ON "webhook_log" USING btree ("created_at");