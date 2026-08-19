ALTER TABLE "habit_logs" ADD COLUMN "completed_value" numeric(10, 2) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD COLUMN "earned_xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "target_value" numeric(10, 2) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "base_xp" integer DEFAULT 50 NOT NULL;