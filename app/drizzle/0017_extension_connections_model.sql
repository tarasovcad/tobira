CREATE TABLE "extension_connections" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"user_code_hash" text,
	"credential_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_id" text,
	"name" text DEFAULT 'Tobira Chrome extension' NOT NULL,
	"client_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"pairing_expires_at" timestamp with time zone NOT NULL,
	"credential_expires_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "extension_connections_user_code_hash_key" UNIQUE("user_code_hash"),
	CONSTRAINT "extension_connections_credential_hash_key" UNIQUE("credential_hash"),
	CONSTRAINT "extension_connections_status_check" CHECK ("status" IN ('pending', 'approved', 'active', 'cancelled', 'revoked'))
);
--> statement-breakpoint
ALTER TABLE "extension_connections" ADD CONSTRAINT "extension_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "extension_connections" (
	"id",
	"credential_hash",
	"status",
	"user_id",
	"name",
	"client_metadata",
	"pairing_expires_at",
	"credential_expires_at",
	"approved_at",
	"activated_at",
	"revoked_at",
	"last_used_at",
	"created_at",
	"updated_at"
)
SELECT
	"id",
	"key",
	CASE WHEN "enabled" IS FALSE THEN 'revoked' ELSE 'active' END,
	"referenceId",
	COALESCE("name", 'Tobira Chrome extension'),
	CASE
		WHEN "metadata" IS NULL THEN '{}'::jsonb
		ELSE "metadata"::jsonb - 'source' - 'pairingId' - 'connectedAt'
	END,
	"createdAt",
	"expiresAt",
	"createdAt",
	"createdAt",
	CASE WHEN "enabled" IS FALSE THEN "updatedAt" ELSE NULL END,
	"lastRequest",
	"createdAt",
	"updatedAt"
FROM "apikey"
WHERE "configId" = 'chrome-extension';
--> statement-breakpoint
CREATE INDEX "extension_connections_user_status_idx" ON "extension_connections" USING btree ("user_id", "status");
--> statement-breakpoint
CREATE INDEX "extension_connections_pairing_expires_at_idx" ON "extension_connections" USING btree ("pairing_expires_at");
--> statement-breakpoint
CREATE INDEX "extension_connections_credential_expires_at_idx" ON "extension_connections" USING btree ("credential_expires_at");
--> statement-breakpoint
DROP TABLE "extension_pairings";
--> statement-breakpoint
DROP TABLE "apikey";

