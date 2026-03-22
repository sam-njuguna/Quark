CREATE TABLE "user_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"status_note" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"weekly_schedule" jsonb,
	"show_availability" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_availability_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_availability" ADD CONSTRAINT "user_availability_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_availability_userId_idx" ON "user_availability" USING btree ("user_id");