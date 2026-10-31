import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TaskService } from "@/lib/services/task-service";
import { OrganizationService } from "@/lib/services/organization-service";
import { ActorContext } from "@/lib/types/auth";
import { DomainError } from "@/lib/errors";
import { getDb } from "@/lib/db";

const taskStatusEnum = z.enum([
  "open",
  "in_progress",
  "submitted",
  "in_review",
  "changes_requested",
  "completed",
  "cancelled",
]);

export function registerMcpTools(
  server: McpServer,
  getActor: () => Promise<ActorContext>,
  getDbInstance?: () => Promise<Awaited<ReturnType<typeof getDb>>>
) {
  const resolveDb = async () => (getDbInstance ? await getDbInstance() : await getDb());

  /**
   * Tool: list_organization_members
   * Discovers eligible team members for task assignment in the authenticated organization.
   */
  server.tool(
    "list_organization_members",
    "List all active members of your organization to discover their membership IDs for task assignment.",
    {},
    async () => {
      try {
        const actor = await getActor();
        const db = await resolveDb();
        const members = await OrganizationService.listMembers(actor, db);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                organizationId: actor.organizationId,
                members: members.map((m) => ({
                  membershipId: m.membershipId,
                  displayName: m.displayName,
                  email: m.email,
                  role: m.role,
                })),
              }, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        return handleToolError(err);
      }
    }
  );

  /**
   * Tool: list_tasks
   * Lists tasks for the authenticated organization with optional filtering.
   */
  server.tool(
    "list_tasks",
    "List tasks in your organization with optional filters for status or assignee.",
    {
      status: taskStatusEnum.optional().describe("Filter tasks by lifecycle status."),
      assigneeMembershipId: z
        .string()
        .uuid()
        .optional()
        .describe("Filter tasks assigned to a specific membership ID."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum number of tasks to return (default 50)."),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Offset for pagination (default 0)."),
    },
    async (args) => {
      try {
        const actor = await getActor();
        const db = await resolveDb();
        const tasks = await TaskService.listTasks(actor, args, db);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                total: tasks.length,
                tasks: tasks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  status: t.status,
                  assigneeName: t.assigneeName,
                  assigneeMembershipId: t.assigneeMembershipId,
                  dueAt: t.dueAt ? t.dueAt.toISOString() : null,
                  createdVia: t.createdVia,
                  createdAt: t.createdAt.toISOString(),
                })),
              }, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        return handleToolError(err);
      }
    }
  );

  /**
   * Tool: get_task
   * Retrieves complete details and historical event audit log for a specific task.
   */
  server.tool(
    "get_task",
    "Get full details and complete event audit history for a task by its ID.",
    {
      taskId: z.string().uuid().describe("Unique UUID of the task to retrieve."),
    },
    async ({ taskId }) => {
      try {
        const actor = await getActor();
        const db = await resolveDb();
        const task = await TaskService.getTask(actor, taskId, db);
        const history = await TaskService.getTaskHistory(actor, taskId, db);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                task: {
                  ...task,
                  dueAt: task.dueAt ? task.dueAt.toISOString() : null,
                  createdAt: task.createdAt.toISOString(),
                  updatedAt: task.updatedAt.toISOString(),
                },
                history: history.map((h) => ({
                  id: h.id,
                  eventType: h.eventType,
                  actorName: h.actorName || "System",
                  details: h.details,
                  createdAt: h.createdAt.toISOString(),
                })),
              }, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        return handleToolError(err);
      }
    }
  );

  /**
   * Tool: create_task
   * Creates a structured task in TaskPit assigned to a team member.
   */
  server.tool(
    "create_task",
    "Create and assign a new task within your organization. Requires a title and a valid assignee membership ID from list_organization_members.",
    {
      title: z
        .string()
        .min(1, "Title cannot be empty.")
        .max(200, "Title must be 200 characters or less.")
        .describe("Concise action-oriented title for the task."),
      description: z
        .string()
        .max(5000)
        .optional()
        .describe("Detailed instructions, background context, and expected deliverable criteria."),
      assigneeMembershipId: z
        .string()
        .uuid()
        .describe("The membership ID of the assigned team member (obtained via list_organization_members)."),
      dueAt: z
        .string()
        .datetime()
        .optional()
        .describe("Optional ISO 8601 deadline timestamp (e.g. '2026-11-05T18:00:00Z')."),
    },
    async (args) => {
      try {
        const actor = await getActor();
        const db = await resolveDb();

        const task = await TaskService.createTask(
          actor,
          {
            title: args.title,
            description: args.description || null,
            assigneeMembershipId: args.assigneeMembershipId,
            dueAt: args.dueAt ? new Date(args.dueAt) : null,
            createdVia: "mcp",
          },
          db
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: `Task successfully created and assigned.`,
                task: {
                  id: task.id,
                  title: task.title,
                  status: task.status,
                  assigneeMembershipId: task.assigneeMembershipId,
                  dueAt: task.dueAt ? task.dueAt.toISOString() : null,
                  createdVia: task.createdVia,
                  createdAt: task.createdAt.toISOString(),
                },
              }, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        return handleToolError(err);
      }
    }
  );

  /**
   * Tool: update_task
   * Updates supported fields of an existing task.
   */
  server.tool(
    "update_task",
    "Update fields of an existing task (title, instructions, assignee, status, or deadline).",
    {
      taskId: z.string().uuid().describe("Unique UUID of the task to update."),
      title: z.string().min(1).max(200).optional().describe("New title for the task."),
      description: z.string().max(5000).nullable().optional().describe("Updated instructions or deliverables."),
      assigneeMembershipId: z.string().uuid().optional().describe("Reassign to another member ID in the organization."),
      status: taskStatusEnum.optional().describe("Update task lifecycle status."),
      dueAt: z.string().datetime().nullable().optional().describe("New ISO 8601 deadline, or null to clear deadline."),
    },
    async ({ taskId, ...updates }) => {
      try {
        const actor = await getActor();
        const db = await resolveDb();

        const task = await TaskService.updateTask(
          actor,
          taskId,
          {
            ...updates,
            dueAt: updates.dueAt ? new Date(updates.dueAt) : updates.dueAt,
          },
          db
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: `Task successfully updated.`,
                task: {
                  id: task.id,
                  title: task.title,
                  status: task.status,
                  assigneeMembershipId: task.assigneeMembershipId,
                  dueAt: task.dueAt ? task.dueAt.toISOString() : null,
                  updatedAt: task.updatedAt.toISOString(),
                },
              }, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        return handleToolError(err);
      }
    }
  );
}

function handleToolError(err: unknown) {
  if (err instanceof DomainError) {
    return {
      content: [
        {
          type: "text" as const,
          text: `[TaskPit Error ${err.code}] ${err.message}`,
        },
      ],
      isError: true,
    };
  }

  const message = err instanceof Error ? err.message : "Internal system error.";
  return {
    content: [
      {
        type: "text" as const,
        text: `[TaskPit Error] ${message}`,
      },
    ],
    isError: true,
  };
}
