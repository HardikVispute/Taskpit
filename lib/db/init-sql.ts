export const SCHEMA_INIT_SQL = `
CREATE TYPE "public"."created_via" AS ENUM('web', 'mcp');
CREATE TYPE "public"."membership_role" AS ENUM('leader', 'member', 'volunteer');
CREATE TYPE "public"."task_status" AS ENUM('open', 'in_progress', 'submitted', 'in_review', 'changes_requested', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"join_code" text UNIQUE,
	"join_secret" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supabase_auth_id" uuid UNIQUE,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "organization_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"description" text,
	"assignee_membership_id" uuid NOT NULL REFERENCES "organization_memberships"("id") ON DELETE RESTRICT,
	"created_by_membership_id" uuid NOT NULL REFERENCES "organization_memberships"("id") ON DELETE RESTRICT,
	"due_at" timestamp with time zone,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"created_via" "created_via" DEFAULT 'web' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "task_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
	"organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
	"actor_membership_id" uuid REFERENCES "organization_memberships"("id") ON DELETE SET NULL,
	"event_type" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "org_user_membership_idx" ON "organization_memberships" ("organization_id","user_id");
CREATE INDEX IF NOT EXISTS "membership_org_idx" ON "organization_memberships" ("organization_id");
CREATE INDEX IF NOT EXISTS "membership_user_idx" ON "organization_memberships" ("user_id");
CREATE INDEX IF NOT EXISTS "tasks_org_idx" ON "tasks" ("organization_id");
CREATE INDEX IF NOT EXISTS "tasks_assignee_idx" ON "tasks" ("assignee_membership_id");
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "tasks" ("status");
CREATE INDEX IF NOT EXISTS "task_events_task_idx" ON "task_events" ("task_id");
CREATE INDEX IF NOT EXISTS "task_events_org_idx" ON "task_events" ("organization_id");
CREATE INDEX IF NOT EXISTS "task_events_created_idx" ON "task_events" ("created_at");
`;

