--> statement-breakpoint
ALTER TABLE "comment" ADD COLUMN "parent_id" text;--> statement-breakpoint
CREATE INDEX "comment_parentId_idx" ON "comment" USING btree ("parent_id");--> statement-breakpoint

CREATE TABLE "time_log" (
	"id" text PRIMARY KEY NOT NULL,
	"work_id" text NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "time_log" ADD CONSTRAINT "time_log_work_id_work_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_log" ADD CONSTRAINT "time_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "time_log_workId_idx" ON "time_log" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "time_log_userId_idx" ON "time_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "time_log_startedAt_idx" ON "time_log" USING btree ("started_at");--> statement-breakpoint

CREATE TABLE "custom_field_def" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text,
	"name" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"options" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_field_def" ADD CONSTRAINT "custom_field_def_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_field_def_teamId_idx" ON "custom_field_def" USING btree ("team_id");--> statement-breakpoint

CREATE TABLE "work_custom_field" (
	"id" text PRIMARY KEY NOT NULL,
	"work_id" text NOT NULL,
	"field_id" text NOT NULL,
	"value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_custom_field" ADD CONSTRAINT "work_custom_field_work_id_work_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_custom_field" ADD CONSTRAINT "work_custom_field_field_id_custom_field_def_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."custom_field_def"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "work_custom_field_workId_idx" ON "work_custom_field" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "work_custom_field_fieldId_idx" ON "work_custom_field" USING btree ("field_id");
