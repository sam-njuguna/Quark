ALTER TABLE "work" ADD COLUMN "ai_agent_id" text;--> statement-breakpoint
ALTER TABLE "work" ADD COLUMN "ai_status" text;--> statement-breakpoint
ALTER TABLE "work" ADD COLUMN "ai_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "work" ADD COLUMN "ai_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "work" ADD COLUMN "ai_error" text;--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN "work_types" jsonb DEFAULT '["task"]'::jsonb;--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN "output_format" text DEFAULT 'markdown';--> statement-breakpoint
ALTER TABLE "work" ADD CONSTRAINT "work_ai_agent_id_agent_id_fk" FOREIGN KEY ("ai_agent_id") REFERENCES "public"."agent"("id") ON DELETE set null ON UPDATE no action;