ALTER TYPE "public"."membership_role" ADD VALUE 'volunteer';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "supabase_auth_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_supabase_auth_id_unique" UNIQUE("supabase_auth_id");