ALTER TABLE "organizations" ADD COLUMN "join_code" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "join_secret" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_join_code_unique" UNIQUE("join_code");