CREATE UNIQUE INDEX "org_user_membership_idx" ON "organization_memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "membership_org_idx" ON "organization_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "membership_user_idx" ON "organization_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_events_task_idx" ON "task_events" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_events_org_idx" ON "task_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "task_events_created_idx" ON "task_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tasks_org_idx" ON "tasks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "tasks_assignee_idx" ON "tasks" USING btree ("assignee_membership_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");