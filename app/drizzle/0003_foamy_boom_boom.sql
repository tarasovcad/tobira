CREATE TYPE "public"."sync_connection_method" AS ENUM('oauth', 'extension', 'cookies', 'export', 'har');--> statement-breakpoint
CREATE TYPE "public"."sync_connection_status" AS ENUM('healthy', 'syncing', 'warning', 'error', 'paused', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."sync_deleted_source_behavior" AS ENUM('keep', 'remove');--> statement-breakpoint
CREATE TYPE "public"."sync_event_level" AS ENUM('info', 'success', 'warning', 'error');--> statement-breakpoint
CREATE TYPE "public"."sync_item_status" AS ENUM('active', 'duplicate', 'skipped', 'removed_from_source', 'failed', 'promoted');--> statement-breakpoint
CREATE TYPE "public"."sync_mode" AS ENUM('automatic', 'once');--> statement-breakpoint
CREATE TYPE "public"."sync_provider" AS ENUM('x', 'reddit', 'dribbble', 'chrome', 'arc', 'dia', 'pinterest', 'youtube', 'firefox', 'safari');--> statement-breakpoint
CREATE TYPE "public"."sync_run_status" AS ENUM('queued', 'running', 'success', 'partial_success', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."sync_run_trigger" AS ENUM('manual', 'scheduled', 'initial_connect', 'reconnect', 'retry');--> statement-breakpoint
CREATE TABLE "sync_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" "sync_provider" NOT NULL,
	"method" "sync_connection_method" NOT NULL,
	"status" "sync_connection_status" DEFAULT 'healthy' NOT NULL,
	"sync_mode" "sync_mode" DEFAULT 'automatic' NOT NULL,
	"deleted_source_behavior" "sync_deleted_source_behavior" DEFAULT 'keep' NOT NULL,
	"external_account_id" text NOT NULL,
	"external_username" text,
	"external_display_name" text,
	"external_avatar_url" text,
	"label" text NOT NULL,
	"skip_duplicates" boolean DEFAULT true NOT NULL,
	"notify_on_completion" boolean DEFAULT true NOT NULL,
	"default_collection_id" uuid,
	"provider_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"checkpoint" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_error_code" text,
	"last_error_message" text,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_successful_sync_at" timestamp with time zone,
	"next_sync_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_connections_user_provider_external_account_key" UNIQUE("user_id","provider","external_account_id")
);
--> statement-breakpoint
CREATE TABLE "sync_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"run_id" uuid,
	"sync_item_id" uuid,
	"level" "sync_event_level" NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"requires_action" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_item_bookmark_links" (
	"sync_item_id" uuid NOT NULL,
	"bookmark_id" uuid NOT NULL,
	"promoted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_item_bookmark_links_pkey" PRIMARY KEY("sync_item_id","bookmark_id"),
	CONSTRAINT "sync_item_bookmark_links_sync_item_id_key" UNIQUE("sync_item_id"),
	CONSTRAINT "sync_item_bookmark_links_bookmark_id_key" UNIQUE("bookmark_id")
);
--> statement-breakpoint
CREATE TABLE "sync_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"connection_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"external_url" text NOT NULL,
	"canonical_url" text NOT NULL,
	"title" text,
	"description" text,
	"preview_image" text,
	"kind" "Bookmark kind" NOT NULL,
	"status" "sync_item_status" DEFAULT 'active' NOT NULL,
	"dedupe_key" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_created_at" timestamp with time zone,
	"source_updated_at" timestamp with time zone,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_from_source_at" timestamp with time zone,
	"is_promoted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_items_connection_external_id_key" UNIQUE("connection_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"trigger" "sync_run_trigger" NOT NULL,
	"status" "sync_run_status" NOT NULL,
	"items_discovered" integer DEFAULT 0 NOT NULL,
	"items_created" integer DEFAULT 0 NOT NULL,
	"items_updated" integer DEFAULT 0 NOT NULL,
	"items_skipped" integer DEFAULT 0 NOT NULL,
	"duplicates_skipped" integer DEFAULT 0 NOT NULL,
	"items_failed" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"error_code" text,
	"error_message" text,
	"cursor_before" jsonb,
	"cursor_after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sync_connections" ADD CONSTRAINT "sync_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_connections" ADD CONSTRAINT "sync_connections_default_collection_id_fkey" FOREIGN KEY ("default_collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_events" ADD CONSTRAINT "sync_events_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."sync_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_events" ADD CONSTRAINT "sync_events_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."sync_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_events" ADD CONSTRAINT "sync_events_sync_item_id_fkey" FOREIGN KEY ("sync_item_id") REFERENCES "public"."sync_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_item_bookmark_links" ADD CONSTRAINT "sync_item_bookmark_links_sync_item_id_fkey" FOREIGN KEY ("sync_item_id") REFERENCES "public"."sync_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_item_bookmark_links" ADD CONSTRAINT "sync_item_bookmark_links_bookmark_id_fkey" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_items" ADD CONSTRAINT "sync_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_items" ADD CONSTRAINT "sync_items_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."sync_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."sync_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sync_connections_user_id_idx" ON "sync_connections" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "sync_connections_user_status_provider_idx" ON "sync_connections" USING btree ("user_id","status","provider");--> statement-breakpoint
CREATE INDEX "sync_events_connection_id_idx" ON "sync_events" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "sync_events_run_id_idx" ON "sync_events" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "sync_events_sync_item_id_idx" ON "sync_events" USING btree ("sync_item_id");--> statement-breakpoint
CREATE INDEX "sync_events_connection_created_at_idx" ON "sync_events" USING btree ("connection_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sync_events_attention_idx" ON "sync_events" USING btree ("connection_id","created_at" DESC NULLS LAST) WHERE requires_action = true AND resolved_at IS NULL AND dismissed_at IS NULL;--> statement-breakpoint
CREATE INDEX "sync_items_user_id_idx" ON "sync_items" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "sync_items_connection_imported_idx" ON "sync_items" USING btree ("connection_id","imported_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sync_items_connection_status_imported_idx" ON "sync_items" USING btree ("connection_id","status","imported_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sync_runs_connection_id_idx" ON "sync_runs" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "sync_runs_connection_created_at_idx" ON "sync_runs" USING btree ("connection_id","created_at" DESC NULLS LAST);