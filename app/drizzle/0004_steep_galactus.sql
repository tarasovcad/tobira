ALTER TABLE "sync_events" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_items" ADD COLUMN "imported_by_run_id" uuid;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD COLUMN "items_removed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_events" ADD CONSTRAINT "sync_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_items" ADD CONSTRAINT "sync_items_imported_by_run_id_fkey" FOREIGN KEY ("imported_by_run_id") REFERENCES "public"."sync_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sync_events_user_id_idx" ON "sync_events" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "sync_events_user_created_at_idx" ON "sync_events" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sync_events_user_attention_idx" ON "sync_events" USING btree ("user_id","created_at" DESC NULLS LAST) WHERE requires_action = true AND resolved_at IS NULL AND dismissed_at IS NULL;--> statement-breakpoint
CREATE INDEX "sync_items_imported_by_run_id_idx" ON "sync_items" USING btree ("imported_by_run_id");--> statement-breakpoint
CREATE INDEX "sync_runs_user_id_idx" ON "sync_runs" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "sync_runs_user_created_at_idx" ON "sync_runs" USING btree ("user_id","created_at" DESC NULLS LAST);