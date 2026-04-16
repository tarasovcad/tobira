ALTER TYPE "public"."Bookmark kind" ADD VALUE 'post';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "aiContext" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "enableAiOptimization" boolean DEFAULT true;