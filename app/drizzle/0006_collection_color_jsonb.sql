ALTER TABLE "collections" ALTER COLUMN "color" SET DATA TYPE jsonb USING CASE WHEN "color" IS NULL THEN NULL ELSE jsonb_build_object('hex', "color", 'opacity', 1) END;--> statement-breakpoint
ALTER TABLE "collections" DROP COLUMN "icon";
