CREATE TABLE "apikey" (
	"id" text PRIMARY KEY NOT NULL,
	"configId" text DEFAULT 'default' NOT NULL,
	"name" text,
	"start" text,
	"referenceId" text NOT NULL,
	"prefix" text,
	"key" text NOT NULL,
	"refillInterval" integer,
	"refillAmount" integer,
	"lastRefillAt" timestamp with time zone,
	"enabled" boolean DEFAULT true,
	"rateLimitEnabled" boolean DEFAULT true,
	"rateLimitTimeWindow" integer DEFAULT 60000,
	"rateLimitMax" integer DEFAULT 300,
	"requestCount" integer DEFAULT 0,
	"remaining" integer,
	"lastRequest" timestamp with time zone,
	"expiresAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"permissions" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "extension_pairings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_code_hash" text NOT NULL,
	"device_token_hash" text NOT NULL,
	"user_id" text,
	"api_key_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"claimed_at" timestamp with time zone,
	"redeemed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "extension_pairings_user_code_hash_key" UNIQUE("user_code_hash"),
	CONSTRAINT "extension_pairings_device_token_hash_key" UNIQUE("device_token_hash")
);
--> statement-breakpoint
ALTER TABLE "extension_pairings" ADD CONSTRAINT "extension_pairings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extension_pairings" ADD CONSTRAINT "extension_pairings_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "public"."apikey"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "apikey_configId_idx" ON "apikey" USING btree ("configId");--> statement-breakpoint
CREATE INDEX "apikey_referenceId_idx" ON "apikey" USING btree ("referenceId");--> statement-breakpoint
CREATE INDEX "apikey_key_idx" ON "apikey" USING btree ("key");--> statement-breakpoint
CREATE INDEX "extension_pairings_expires_at_idx" ON "extension_pairings" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "extension_pairings_user_id_idx" ON "extension_pairings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "extension_pairings_api_key_id_idx" ON "extension_pairings" USING btree ("api_key_id");--> statement-breakpoint
ALTER TABLE "bookmarks" DROP COLUMN IF EXISTS "preview_image";--> statement-breakpoint
ALTER TABLE "sync_items" DROP COLUMN IF EXISTS "preview_image";
