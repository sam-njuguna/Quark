CREATE TABLE "sprint" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"team_id" text NOT NULL,
	"created_by" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"goal" text,
	"status" text DEFAULT 'planning' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprint_work" (
	"id" text PRIMARY KEY NOT NULL,
	"sprint_id" text NOT NULL,
	"work_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sprint" ADD CONSTRAINT "sprint_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint" ADD CONSTRAINT "sprint_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint_work" ADD CONSTRAINT "sprint_work_sprint_id_sprint_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprint"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprint_work" ADD CONSTRAINT "sprint_work_work_id_work_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sprint_teamId_idx" ON "sprint" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "sprint_status_idx" ON "sprint" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sprint_endDate_idx" ON "sprint" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "sprint_work_sprintId_idx" ON "sprint_work" USING btree ("sprint_id");--> statement-breakpoint
CREATE INDEX "sprint_work_workId_idx" ON "sprint_work" USING btree ("work_id");