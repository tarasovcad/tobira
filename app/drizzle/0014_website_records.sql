CREATE TABLE IF NOT EXISTS "website_records" (
	"key" text PRIMARY KEY NOT NULL,
	"normalized_url" text NOT NULL,
	"hostname" text NOT NULL,
	"title" text,
	"description" text,
	"images" jsonb,
	"html_status" text NOT NULL,
	"preview_status" text NOT NULL,
	"html_fetched_at" timestamp with time zone NOT NULL,
	"preview_fetched_at" timestamp with time zone NOT NULL,
	"html_refresh_after" timestamp with time zone NOT NULL,
	"preview_refresh_after" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN IF NOT EXISTS "website_record_key" text;
--> statement-breakpoint
INSERT INTO "website_records" (
	"key",
	"normalized_url",
	"hostname",
	"title",
	"description",
	"images",
	"html_status",
	"preview_status",
	"html_fetched_at",
	"preview_fetched_at",
	"html_refresh_after",
	"preview_refresh_after",
	"updated_at"
)
SELECT DISTINCT ON ("bookmarks"."website_record_key")
	"bookmarks"."website_record_key",
	"bookmarks"."url",
	COALESCE(
		NULLIF(split_part(regexp_replace("bookmarks"."url", '^https?://', ''), '/', 1), ''),
		'unknown'
	),
	"bookmarks"."title",
	"bookmarks"."description",
	jsonb_strip_nulls(jsonb_build_object(
		'favicon', "bookmarks"."images"->'favicon',
		'og', "bookmarks"."images"->'og',
		'preview', "bookmarks"."images"->'preview'
	)),
	CASE WHEN "bookmarks"."title" IS NOT NULL OR "bookmarks"."description" IS NOT NULL THEN 'ready' ELSE 'missing' END,
	CASE
		WHEN "bookmarks"."images"->'preview'->>'status' IN ('ready', 'failed', 'missing') THEN "bookmarks"."images"->'preview'->>'status'
		ELSE 'missing'
	END,
	now(),
	now(),
	now() + interval '90 days',
	CASE WHEN "bookmarks"."images"->'preview'->>'status' = 'failed' THEN now() + interval '10 days' ELSE now() + interval '90 days' END,
	now()
FROM "bookmarks"
WHERE "bookmarks"."website_record_key" IS NOT NULL
ORDER BY "bookmarks"."website_record_key", "bookmarks"."updated_at" DESC NULLS LAST, "bookmarks"."created_at" DESC
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_website_record_key_fkey" FOREIGN KEY ("website_record_key") REFERENCES "public"."website_records"("key") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "website_records_hostname_idx" ON "website_records" USING btree ("hostname");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "website_records_html_refresh_after_idx" ON "website_records" USING btree ("html_refresh_after");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "website_records_preview_refresh_after_idx" ON "website_records" USING btree ("preview_refresh_after");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookmarks_website_record_key_idx" ON "bookmarks" USING btree ("website_record_key");
