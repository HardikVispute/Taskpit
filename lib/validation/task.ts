import { z } from "zod";

export const taskStatusSchema = z.enum([
  "open",
  "in_progress",
  "submitted",
  "in_review",
  "changes_requested",
  "completed",
  "cancelled",
]);

export const createdViaSchema = z.enum(["web", "mcp"]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title cannot be empty.")
    .max(200, "Task title must be 200 characters or less."),
  description: z
    .string()
    .trim()
    .max(5000, "Task description must be 5000 characters or less.")
    .nullable()
    .optional(),
  assigneeMembershipId: z
    .string()
    .uuid("Invalid assignee ID."),
  dueAt: z
    .union([z.string().datetime(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  createdVia: createdViaSchema.optional().default("web"),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title cannot be empty.")
    .max(200, "Task title must be 200 characters or less.")
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, "Task description must be 5000 characters or less.")
    .nullable()
    .optional(),
  assigneeMembershipId: z.string().uuid("Invalid assignee ID.").optional(),
  dueAt: z
    .union([z.string().datetime(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
  status: taskStatusSchema.optional(),
});

export const listTasksFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  assigneeMembershipId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksFilter = z.infer<typeof listTasksFilterSchema>;
