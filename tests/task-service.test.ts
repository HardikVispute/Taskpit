import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "@/lib/db";
import { TaskService } from "@/lib/services/task-service";
import { OrganizationService } from "@/lib/services/organization-service";
import {
  ForbiddenError,
  InvalidAssigneeError,
  TaskNotFoundError,
  ValidationError,
} from "@/lib/errors";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Phase 2: Persistent Task Backend & Business Rules", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;
  let orgA: Awaited<ReturnType<typeof OrganizationService.seedTestOrganization>>;
  let orgB: Awaited<ReturnType<typeof OrganizationService.seedTestOrganization>>;

  beforeEach(async () => {
    // Instantiate fresh, isolated in-memory PostgreSQL for each test
    db = await createTestDb();
    orgA = await OrganizationService.seedTestOrganization(db, "ACM Student Chapter");
    orgB = await OrganizationService.seedTestOrganization(db, "Robotics Club");
  });

  describe("Task Creation & Audit Logging", () => {
    it("allows a leader to create a task and records an atomic task_created event", async () => {
      const task = await TaskService.createTask(
        orgA.leader,
        {
          title: "Book Auditorium for Tech Symposium",
          description: "Coordinate with campus facilities to reserve Hall A.",
          assigneeMembershipId: orgA.memberships.priya.id,
          dueAt: new Date(Date.now() + 86400000).toISOString(),
          createdVia: "web",
        },
        db
      );

      expect(task).toBeDefined();
      expect(task.title).toBe("Book Auditorium for Tech Symposium");
      expect(task.status).toBe("open");
      expect(task.organizationId).toBe(orgA.organization.id);
      expect(task.assigneeMembershipId).toBe(orgA.memberships.priya.id);
      expect(task.createdByMembershipId).toBe(orgA.leader.membershipId);

      // Verify audit event persisted
      const history = await TaskService.getTaskHistory(orgA.leader, task.id, db);
      expect(history).toHaveLength(1);
      expect(history[0].eventType).toBe("task_created");
      expect(history[0].actorMembershipId).toBe(orgA.leader.membershipId);
      expect(history[0].details).toMatchObject({
        title: "Book Auditorium for Tech Symposium",
        assigneeMembershipId: orgA.memberships.priya.id,
      });
    });

    it("rejects task creation by a regular member with ForbiddenError", async () => {
      await expect(
        TaskService.createTask(
          orgA.member,
          {
            title: "Unauthorized Task Attempt",
            assigneeMembershipId: orgA.memberships.priya.id,
          },
          db
        )
      ).rejects.toThrow(ForbiddenError);

      // Verify no task was created in DB
      const allTasks = await db.select().from(tasks);
      expect(allTasks).toHaveLength(0);
    });

    it("rejects assigning a task to a user outside the organization with InvalidAssigneeError", async () => {
      // Attempt to assign to Priya in Org B instead of Org A
      await expect(
        TaskService.createTask(
          orgA.leader,
          {
            title: "Cross-Org Assignment Attempt",
            assigneeMembershipId: orgB.memberships.priya.id,
          },
          db
        )
      ).rejects.toThrow(InvalidAssigneeError);

      const allTasks = await db.select().from(tasks);
      expect(allTasks).toHaveLength(0);
    });

    it("rejects task creation with empty or whitespace-only title", async () => {
      await expect(
        TaskService.createTask(
          orgA.leader,
          {
            title: "   ",
            assigneeMembershipId: orgA.memberships.priya.id,
          },
          db
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("Tenant Isolation & Cross-Organization Security", () => {
    it("prevents a leader in Org B from reading tasks from Org A", async () => {
      const taskInOrgA = await TaskService.createTask(
        orgA.leader,
        {
          title: "Org A Confidential Task",
          assigneeMembershipId: orgA.memberships.alex.id,
        },
        db
      );

      // Leader in Org B attempts to read taskInOrgA
      await expect(
        TaskService.getTask(orgB.leader, taskInOrgA.id, db)
      ).rejects.toThrow(TaskNotFoundError);
    });

    it("prevents a leader in Org B from editing tasks from Org A", async () => {
      const taskInOrgA = await TaskService.createTask(
        orgA.leader,
        {
          title: "Original Title",
          assigneeMembershipId: orgA.memberships.alex.id,
        },
        db
      );

      // Leader in Org B attempts to update task in Org A
      await expect(
        TaskService.updateTask(
          orgB.leader,
          taskInOrgA.id,
          { title: "Hacked Title" },
          db
        )
      ).rejects.toThrow(TaskNotFoundError);

      // Ensure task in DB remains unchanged
      const [persisted] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskInOrgA.id));
      expect(persisted.title).toBe("Original Title");
    });

    it("ensures members only list tasks assigned to them, while leaders see all org tasks", async () => {
      // Task 1 for Priya
      await TaskService.createTask(
        orgA.leader,
        {
          title: "Priya's Task",
          assigneeMembershipId: orgA.memberships.priya.id,
        },
        db
      );

      // Task 2 for Alex
      await TaskService.createTask(
        orgA.leader,
        {
          title: "Alex's Task",
          assigneeMembershipId: orgA.memberships.alex.id,
        },
        db
      );

      // Leader sees both tasks
      const leaderList = await TaskService.listTasks(orgA.leader, {}, db);
      expect(leaderList).toHaveLength(2);

      // Priya (member) only sees her task
      const priyaList = await TaskService.listTasks(orgA.member, {}, db);
      expect(priyaList).toHaveLength(1);
      expect(priyaList[0].title).toBe("Priya's Task");
    });
  });

  describe("Task Updates & Event History", () => {
    it("allows a leader to update title, status, and reassignment, producing audit events", async () => {
      const task = await TaskService.createTask(
        orgA.leader,
        {
          title: "Initial Planning",
          description: "Draft budget",
          assigneeMembershipId: orgA.memberships.priya.id,
        },
        db
      );

      const updated = await TaskService.updateTask(
        orgA.leader,
        task.id,
        {
          title: "Finalized Budget",
          assigneeMembershipId: orgA.memberships.alex.id,
          status: "in_progress",
        },
        db
      );

      expect(updated.title).toBe("Finalized Budget");
      expect(updated.assigneeMembershipId).toBe(orgA.memberships.alex.id);
      expect(updated.status).toBe("in_progress");

      const history = await TaskService.getTaskHistory(orgA.leader, task.id, db);
      expect(history).toHaveLength(2);
      expect(history[0].eventType).toBe("task_updated");
      expect(history[0].details).toHaveProperty("changes");
    });

    it("rejects reassignment to an invalid or external organization member", async () => {
      const task = await TaskService.createTask(
        orgA.leader,
        {
          title: "Valid Task",
          assigneeMembershipId: orgA.memberships.priya.id,
        },
        db
      );

      await expect(
        TaskService.updateTask(
          orgA.leader,
          task.id,
          {
            assigneeMembershipId: orgB.memberships.alex.id,
          },
          db
        )
      ).rejects.toThrow(InvalidAssigneeError);
    });
  });
});
