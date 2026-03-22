CREATE TABLE "webhook" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"created_by" text NOT NULL,
	"url" text NOT NULL,
	"events" jsonb DEFAULT '["work.created","work.stage_changed","work.assigned","work.completed","work.blocked","work.cancelled"]'::jsonb NOT NULL,
	"secret" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp,
	"last_status_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_work" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"created_by" text NOT NULL,
	"pattern" text NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"template_title" text NOT NULL,
	"template_type" text DEFAULT 'task' NOT NULL,
	"template_description" text,
	"template_instructions" text,
	"template_priority" integer DEFAULT 2,
	"template_success_criteria" jsonb,
	"next_run_at" timestamp NOT NULL,
	"last_run_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_work" ADD CONSTRAINT "recurring_work_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_work" ADD CONSTRAINT "recurring_work_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "webhook_teamId_idx" ON "webhook" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "recurring_work_teamId_idx" ON "recurring_work" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "recurring_work_nextRunAt_idx" ON "recurring_work" USING btree ("next_run_at");