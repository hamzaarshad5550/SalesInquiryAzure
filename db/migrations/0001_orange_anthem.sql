ALTER TABLE "campaigns" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "tags" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "target_audience" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "associated_products" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "engagements" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "conversions" integer DEFAULT 0 NOT NULL;