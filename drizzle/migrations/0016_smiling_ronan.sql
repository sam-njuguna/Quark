CREATE TABLE "agent" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"team_id" text,
	"owner_id" text,
	"agent_type" text DEFAULT 'mcp' NOT NULL,
	"config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp,
	"max_concurrent_tasks" text DEFAULT '5',
	"rate_limit" text DEFAULT '60',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_task" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"work_id" text,
	"title" text NOT NULL,
	"description" text,
	"instructions" text,
	"priority" text DEFAULT 'normal',
	"status" text DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"error" text,
	"assigned_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"retry_count" text DEFAULT '0',
	"max_retries" text DEFAULT '3',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_work_log" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"task_id" text,
	"work_id" text,
	"action" text NOT NULL,
	"message" text,
	"metadata" jsonb,
	"duration" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_task" ADD CONSTRAINT "agent_task_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_task" ADD CONSTRAINT "agent_task_work_id_work_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_work_log" ADD CONSTRAINT "agent_work_log_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_work_log" ADD CONSTRAINT "agent_work_log_task_id_agent_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."agent_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_work_log" ADD CONSTRAINT "agent_work_log_work_id_work_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."work"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_task_agentId_idx" ON "agent_task" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_task_status_idx" ON "agent_task" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_task_workId_idx" ON "agent_task" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "agent_work_log_agentId_idx" ON "agent_work_log" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_work_log_taskId_idx" ON "agent_work_log" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "agent_work_log_createdAt_idx" ON "agent_work_log" USING btree ("created_at");