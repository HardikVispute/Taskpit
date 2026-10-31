import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("membership_role", ["leader", "member", "volunteer"]);
export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "in_progress",
  "submitted",
  "in_review",
  "changes_requested",
  "completed",
  "cancelled",
]);
export const createdViaEnum = pgEnum("created_via", ["web", "mcp"]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  joinCode: text("join_code").unique(),
  joinSecret: text("join_secret"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  supabaseAuthId: uuid("supabase_auth_id").unique(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: roleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("org_user_membership_idx").on(
      table.organizationId,
      table.userId
    ),
    index("membership_org_idx").on(table.organizationId),
    index("membership_user_idx").on(table.userId),
  ]
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    assigneeMembershipId: uuid("assignee_membership_id")
      .references(() => organizationMemberships.id, { onDelete: "restrict" })
      .notNull(),
    createdByMembershipId: uuid("created_by_membership_id")
      .references(() => organizationMemberships.id, { onDelete: "restrict" })
      .notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    status: taskStatusEnum("status").notNull().default("open"),
    createdVia: createdViaEnum("created_via").notNull().default("web"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tasks_org_idx").on(table.organizationId),
    index("tasks_assignee_idx").on(table.assigneeMembershipId),
    index("tasks_status_idx").on(table.status),
  ]
);

export const taskEvents = pgTable(
  "task_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    actorMembershipId: uuid("actor_membership_id").references(
      () => organizationMemberships.id,
      { onDelete: "set null" }
    ),
    eventType: text("event_type").notNull(),
    details: jsonb("details").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_events_task_idx").on(table.taskId),
    index("task_events_org_idx").on(table.organizationId),
    index("task_events_created_idx").on(table.createdAt),
  ]
);

// Drizzle Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(organizationMemberships),
  tasks: many(tasks),
  taskEvents: many(taskEvents),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMemberships),
}));

export const organizationMembershipsRelations = relations(
  organizationMemberships,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [organizationMemberships.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMemberships.userId],
      references: [users.id],
    }),
    assignedTasks: many(tasks, { relationName: "assignedTasks" }),
    createdTasks: many(tasks, { relationName: "createdTasks" }),
    actedEvents: many(taskEvents),
  })
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tasks.organizationId],
    references: [organizations.id],
  }),
  assignee: one(organizationMemberships, {
    fields: [tasks.assigneeMembershipId],
    references: [organizationMemberships.id],
    relationName: "assignedTasks",
  }),
  creator: one(organizationMemberships, {
    fields: [tasks.createdByMembershipId],
    references: [organizationMemberships.id],
    relationName: "createdTasks",
  }),
  events: many(taskEvents),
}));

export const taskEventsRelations = relations(taskEvents, ({ one }) => ({
  task: one(tasks, {
    fields: [taskEvents.taskId],
    references: [tasks.id],
  }),
  organization: one(organizations, {
    fields: [taskEvents.organizationId],
    references: [organizations.id],
  }),
  actor: one(organizationMemberships, {
    fields: [taskEvents.actorMembershipId],
    references: [organizationMemberships.id],
  }),
}));
