CREATE TABLE "role_capability" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"role" text NOT NULL,
	"capability" text NOT NULL,
	"granted" jsonb NOT NULL,
	"denied" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_capability" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"capability" text NOT NULL,
	"granted" jsonb NOT NULL,
	"denied" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work" ADD COLUMN "embedding" text;--> statement-breakpoint
ALTER TABLE "role_capability" ADD CONSTRAINT "role_capability_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_capability" ADD CONSTRAINT "user_capability_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_capability" ADD CONSTRAINT "user_capability_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "role_capability_teamId_idx" ON "role_capability" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "role_capability_role_idx" ON "role_capability" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_capability_userId_idx" ON "user_capability" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_capability_teamId_idx" ON "user_capability" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "user_capability_capability_idx" ON "user_capability" USING btree ("capability");