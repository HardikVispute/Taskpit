import { eq, and, desc, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  tasks,
  taskEvents,
  organizationMemberships,
  users,
} from "@/lib/db/schema";
import { ActorContext } from "@/lib/types/auth";
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksFilterSchema,
} from "@/lib/validation/task";
import {
  ForbiddenError,
  InvalidAssigneeError,
  TaskNotFoundError,
  ValidationError,
} from "@/lib/errors";

export class TaskService {
  /**
   * Creates a new task and atomically records a task_created event.
   */
  static async createTask(
    actor: ActorContext,
    rawInput: unknown,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ) {
    if (actor.role !== "leader") {
      throw new ForbiddenError("Only organization leaders can create tasks.");
    }

    const validation = createTaskSchema.safeParse(rawInput);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.issues[0]?.message || "Invalid task input.",
        validation.error.issues
      );
    }

    const input = validation.data;
    const db = dbInstance ?? (await getDb());

    // Validate assignee belongs to the leader's organization
    const [assigneeMembership] = await db
      .select({ id: organizationMemberships.id })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.id, input.assigneeMembershipId),
          eq(organizationMemberships.organizationId, actor.organizationId)
        )
      )
      .limit(1);

    if (!assigneeMembership) {
      throw new InvalidAssigneeError(
        "Assignee must be an active member of the same organization."
      );
    }

    // Atomic transaction: Insert Task + TaskEvent
    return await db.transaction(async (tx) => {
      const [newTask] = await tx
        .insert(tasks)
        .values({
          organizationId: actor.organizationId,
          title: input.title,
          description: input.description ?? null,
          assigneeMembershipId: input.assigneeMembershipId,
          createdByMembershipId: actor.membershipId,
          dueAt: input.dueAt ?? null,
          status: "open",
          createdVia: input.createdVia ?? "web",
        })
        .returning();

      await tx.insert(taskEvents).values({
        taskId: newTask.id,
        organizationId: actor.organizationId,
        actorMembershipId: actor.membershipId,
        eventType: "task_created",
        details: {
          title: newTask.title,
          assigneeMembershipId: newTask.assigneeMembershipId,
          dueAt: newTask.dueAt ? newTask.dueAt.toISOString() : null,
          createdVia: newTask.createdVia,
        },
      });

      return newTask;
    });
  }

  /**
   * Retrieves a task by ID ensuring organization isolation and role permissions.
   */
  static async getTask(
    actor: ActorContext,
    taskId: string,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ) {
    const db = dbInstance ?? (await getDb());

    const [task] = await db
      .select({
        id: tasks.id,
        organizationId: tasks.organizationId,
        title: tasks.title,
        description: tasks.description,
        assigneeMembershipId: tasks.assigneeMembershipId,
        createdByMembershipId: tasks.createdByMembershipId,
        dueAt: tasks.dueAt,
        status: tasks.status,
        createdVia: tasks.createdVia,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assigneeName: users.displayName,
        assigneeEmail: users.email,
      })
      .from(tasks)
      .innerJoin(
        organizationMemberships,
        eq(tasks.assigneeMembershipId, organizationMemberships.id)
      )
      .innerJoin(users, eq(organizationMemberships.userId, users.id))
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.organizationId, actor.organizationId)
        )
      )
      .limit(1);

    if (!task) {
      throw new TaskNotFoundError("Task not found or access denied.");
    }

    // Members can only view tasks assigned to them; leaders can view all org tasks
    if (actor.role === "member" && task.assigneeMembershipId !== actor.membershipId) {
      throw new TaskNotFoundError("Task not found or access denied.");
    }

    return task;
  }

  /**
   * Lists tasks for the organization with pagination and optional filters.
   */
  static async listTasks(
    actor: ActorContext,
    rawFilter?: unknown,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ) {
    const validation = listTasksFilterSchema.safeParse(rawFilter ?? {});
    if (!validation.success) {
      throw new ValidationError(
        validation.error.issues[0]?.message || "Invalid filter parameters.",
        validation.error.issues
      );
    }

    const filter = validation.data;
    const db = dbInstance ?? (await getDb());

    const conditions = [eq(tasks.organizationId, actor.organizationId)];

    // Role-based visibility
    if (actor.role === "member") {
      conditions.push(eq(tasks.assigneeMembershipId, actor.membershipId));
    } else if (filter.assigneeMembershipId) {
      conditions.push(eq(tasks.assigneeMembershipId, filter.assigneeMembershipId));
    }

    if (filter.status) {
      conditions.push(eq(tasks.status, filter.status));
    }

    return await db
      .select({
        id: tasks.id,
        organizationId: tasks.organizationId,
        title: tasks.title,
        description: tasks.description,
        assigneeMembershipId: tasks.assigneeMembershipId,
        createdByMembershipId: tasks.createdByMembershipId,
        dueAt: tasks.dueAt,
        status: tasks.status,
        createdVia: tasks.createdVia,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assigneeName: users.displayName,
      })
      .from(tasks)
      .innerJoin(
        organizationMemberships,
        eq(tasks.assigneeMembershipId, organizationMemberships.id)
      )
      .innerJoin(users, eq(organizationMemberships.userId, users.id))
      .where(and(...conditions))
      .orderBy(asc(tasks.dueAt), desc(tasks.createdAt))
      .limit(filter.limit)
      .offset(filter.offset);
  }

  /**
   * Updates supported fields of an existing task and atomically appends an audit event.
   */
  static async updateTask(
    actor: ActorContext,
    taskId: string,
    rawUpdates: unknown,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ) {
    if (actor.role !== "leader") {
      throw new ForbiddenError("Only organization leaders can edit tasks.");
    }

    const validation = updateTaskSchema.safeParse(rawUpdates);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.issues[0]?.message || "Invalid update input.",
        validation.error.issues
      );
    }

    const updates = validation.data;
    const db = dbInstance ?? (await getDb());

    // Verify task exists in the organization
    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.organizationId, actor.organizationId)
        )
      )
      .limit(1);

    if (!existingTask) {
      throw new TaskNotFoundError("Task not found or access denied.");
    }

    // If reassigning, verify new assignee belongs to this organization
    if (
      updates.assigneeMembershipId &&
      updates.assigneeMembershipId !== existingTask.assigneeMembershipId
    ) {
      const [assigneeMembership] = await db
        .select({ id: organizationMemberships.id })
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.id, updates.assigneeMembershipId),
            eq(organizationMemberships.organizationId, actor.organizationId)
          )
        )
        .limit(1);

      if (!assigneeMembership) {
        throw new InvalidAssigneeError(
          "Assignee must be an active member of the same organization."
        );
      }
    }

    // Atomic transaction for update + audit log
    return await db.transaction(async (tx) => {
      const updatePayload: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      const changes: Record<string, { previous: unknown; current: unknown }> = {};

      if (updates.title !== undefined && updates.title !== existingTask.title) {
        updatePayload.title = updates.title;
        changes.title = { previous: existingTask.title, current: updates.title };
      }

      if (
        updates.description !== undefined &&
        updates.description !== existingTask.description
      ) {
        updatePayload.description = updates.description;
        changes.description = {
          previous: existingTask.description,
          current: updates.description,
        };
      }

      if (
        updates.assigneeMembershipId !== undefined &&
        updates.assigneeMembershipId !== existingTask.assigneeMembershipId
      ) {
        updatePayload.assigneeMembershipId = updates.assigneeMembershipId;
        changes.assigneeMembershipId = {
          previous: existingTask.assigneeMembershipId,
          current: updates.assigneeMembershipId,
        };
      }

      if (
        updates.dueAt !== undefined &&
        (updates.dueAt?.getTime() !== existingTask.dueAt?.getTime())
      ) {
        updatePayload.dueAt = updates.dueAt;
        changes.dueAt = {
          previous: existingTask.dueAt?.toISOString() ?? null,
          current: updates.dueAt?.toISOString() ?? null,
        };
      }

      if (updates.status !== undefined && updates.status !== existingTask.status) {
        updatePayload.status = updates.status;
        changes.status = {
          previous: existingTask.status,
          current: updates.status,
        };
      }

      // If no effective changes, return existing task
      if (Object.keys(changes).length === 0) {
        return existingTask;
      }

      const [updatedTask] = await tx
        .update(tasks)
        .set(updatePayload)
        .where(eq(tasks.id, taskId))
        .returning();

      await tx.insert(taskEvents).values({
        taskId: updatedTask.id,
        organizationId: actor.organizationId,
        actorMembershipId: actor.membershipId,
        eventType: "task_updated",
        details: { changes },
      });

      return updatedTask;
    });
  }

  /**
   * Retrieves the append-only event audit history for a task.
   */
  static async getTaskHistory(
    actor: ActorContext,
    taskId: string,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ) {
    const db = dbInstance ?? (await getDb());

    // Verify task exists and actor has permission to view it
    await this.getTask(actor, taskId, db);

    return await db
      .select({
        id: taskEvents.id,
        taskId: taskEvents.taskId,
        actorMembershipId: taskEvents.actorMembershipId,
        eventType: taskEvents.eventType,
        details: taskEvents.details,
        createdAt: taskEvents.createdAt,
        actorName: users.displayName,
      })
      .from(taskEvents)
      .leftJoin(
        organizationMemberships,
        eq(taskEvents.actorMembershipId, organizationMemberships.id)
      )
      .leftJoin(users, eq(organizationMemberships.userId, users.id))
      .where(
        and(
          eq(taskEvents.taskId, taskId),
          eq(taskEvents.organizationId, actor.organizationId)
        )
      )
      .orderBy(desc(taskEvents.createdAt));
  }
}
