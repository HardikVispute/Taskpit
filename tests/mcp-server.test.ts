import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createMcpServer } from "@/mcp/server";
import { createTestDb } from "@/lib/db";
import { OrganizationService } from "@/lib/services/organization-service";
import { tasks, taskEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface McpToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

describe("Phase 4: MCP Server Integration & Security", () => {
  const TEST_API_KEY = "test_mcp_secret_key_123";
  let db: Awaited<ReturnType<typeof createTestDb>>;
  let orgA: Awaited<ReturnType<typeof OrganizationService.seedTestOrganization>>;
  let orgB: Awaited<ReturnType<typeof OrganizationService.seedTestOrganization>>;

  beforeEach(async () => {
    process.env.TASKPIT_API_KEY = TEST_API_KEY;
    db = await createTestDb();
    orgA = await OrganizationService.seedTestOrganization(db, "ACM Student Chapter");
    orgB = await OrganizationService.seedTestOrganization(db, "Robotics Society");
  });

  afterEach(() => {
    delete process.env.TASKPIT_API_KEY;
  });

  async function createConnectedClient(options: {
    apiKey?: string;
    actorOverride?: typeof orgA.leader;
  } = {}) {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const server = createMcpServer({
      apiKey: options.apiKey ?? TEST_API_KEY,
      dbInstance: db,
      actorOverride: options.actorOverride,
    });

    await server.connect(serverTransport);

    const client = new Client(
      { name: "test-ai-assistant", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(clientTransport);
    return { client, server };
  }

  describe("Tool Discovery", () => {
    it("exposes all registered TaskPit tools with clear descriptions and schemas", async () => {
      const { client } = await createConnectedClient();
      const { tools } = await client.listTools();

      const toolNames = tools.map((t) => t.name);
      expect(toolNames).toContain("list_organization_members");
      expect(toolNames).toContain("list_tasks");
      expect(toolNames).toContain("get_task");
      expect(toolNames).toContain("create_task");
      expect(toolNames).toContain("update_task");

      const createTool = tools.find((t) => t.name === "create_task");
      expect(createTool?.description).toContain("Create and assign a new task");
      expect(createTool?.inputSchema.properties).toHaveProperty("title");
      expect(createTool?.inputSchema.properties).toHaveProperty("assigneeMembershipId");
    });
  });

  describe("Authentication & Identity Resolution", () => {
    it("rejects tool calls when API key is invalid or missing", async () => {
      const { client } = await createConnectedClient({ apiKey: "wrong_key" });

      const res = (await client.callTool({
        name: "list_tasks",
        arguments: {},
      })) as McpToolResult;

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("UNAUTHORIZED");
      expect(res.content[0].text).toContain("Invalid or missing TASKPIT_API_KEY");
    });

    it("rejects default placeholder API key in production environment", async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalApiKey = process.env.TASKPIT_API_KEY;
      const env = process.env as Record<string, string | undefined>;
      try {
        env.NODE_ENV = "production";
        delete env.TASKPIT_API_KEY;

        const { client } = await createConnectedClient({ apiKey: "tp_dev_test_placeholder_key" });

        const res = (await client.callTool({
          name: "list_tasks",
          arguments: {},
        })) as McpToolResult;

        expect(res.isError).toBe(true);
        expect(res.content[0].text).toContain("UNAUTHORIZED");
        expect(res.content[0].text).toContain("TASKPIT_API_KEY must be configured in production");
      } finally {
        env.NODE_ENV = originalNodeEnv;
        env.TASKPIT_API_KEY = originalApiKey;
      }
    });

    it("rejects task creation when acting actor is a non-leader member", async () => {
      const { client } = await createConnectedClient({
        actorOverride: orgA.member, // Regular member role
      });

      const res = (await client.callTool({
        name: "create_task",
        arguments: {
          title: "Member attempt to create task",
          assigneeMembershipId: orgA.memberships.priya.id,
        },
      })) as McpToolResult;

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("FORBIDDEN");
      expect(res.content[0].text).toContain("Only organization leaders can create tasks");
    });
  });

  describe("Member Discovery & Task Management End-to-End", () => {
    it("lists organization members for assignee discovery", async () => {
      const { client } = await createConnectedClient();

      const res = (await client.callTool({
        name: "list_organization_members",
        arguments: {},
      })) as McpToolResult;

      expect(res.isError).toBeFalsy();
      const data = JSON.parse(res.content[0].text);
      expect(data.organizationId).toBe(orgA.organization.id);
      expect(data.members.length).toBeGreaterThanOrEqual(4);

      const priya = data.members.find((m: { displayName: string; membershipId: string }) => m.displayName.includes("Priya"));
      expect(priya).toBeDefined();
      expect(priya.membershipId).toBe(orgA.memberships.priya.id);
    });

    it("creates real persistent task via MCP and records task_events audit log", async () => {
      const { client } = await createConnectedClient();

      const res = (await client.callTool({
        name: "create_task",
        arguments: {
          title: "Reserve Main Auditorium",
          description: "Book Hall B for the annual hackathon opening ceremony.",
          assigneeMembershipId: orgA.memberships.priya.id,
          dueAt: "2026-11-10T15:00:00Z",
        },
      })) as McpToolResult;

      expect(res.isError).toBeFalsy();
      const data = JSON.parse(res.content[0].text);
      expect(data.success).toBe(true);
      expect(data.task.title).toBe("Reserve Main Auditorium");
      expect(data.task.createdVia).toBe("mcp");

      // Verify real database persistence
      const [persistedTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, data.task.id));

      expect(persistedTask).toBeDefined();
      expect(persistedTask.title).toBe("Reserve Main Auditorium");
      expect(persistedTask.createdVia).toBe("mcp");
      expect(persistedTask.organizationId).toBe(orgA.organization.id);

      // Verify atomic audit event persisted in task_events
      const events = await db
        .select()
        .from(taskEvents)
        .where(eq(taskEvents.taskId, data.task.id));

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("task_created");
      expect(events[0].actorMembershipId).toBe(orgA.leader.membershipId);
    });

    it("retrieves full task details and history via get_task", async () => {
      const { client } = await createConnectedClient();

      // First create a task
      const createRes = (await client.callTool({
        name: "create_task",
        arguments: {
          title: "Setup PA System",
          assigneeMembershipId: orgA.memberships.alex.id,
        },
      })) as McpToolResult;

      const createdData = JSON.parse(createRes.content[0].text);
      const taskId = createdData.task.id;

      // Now query via get_task
      const getRes = (await client.callTool({
        name: "get_task",
        arguments: { taskId },
      })) as McpToolResult;

      expect(getRes.isError).toBeFalsy();
      const data = JSON.parse(getRes.content[0].text);
      expect(data.task.id).toBe(taskId);
      expect(data.task.title).toBe("Setup PA System");
      expect(data.history).toHaveLength(1);
      expect(data.history[0].eventType).toBe("task_created");
    });

    it("updates an existing task via update_task and appends an audit event", async () => {
      const { client } = await createConnectedClient();

      const createRes = (await client.callTool({
        name: "create_task",
        arguments: {
          title: "Draft Sponsor Letter",
          assigneeMembershipId: orgA.memberships.priya.id,
        },
      })) as McpToolResult;

      const taskId = JSON.parse(createRes.content[0].text).task.id;

      const updateRes = (await client.callTool({
        name: "update_task",
        arguments: {
          taskId,
          title: "Draft & Review Sponsor Letter",
          status: "in_progress",
        },
      })) as McpToolResult;

      expect(updateRes.isError).toBeFalsy();
      const updatedData = JSON.parse(updateRes.content[0].text);
      expect(updatedData.task.title).toBe("Draft & Review Sponsor Letter");
      expect(updatedData.task.status).toBe("in_progress");

      // Verify 2 history events exist in DB
      const events = await db
        .select()
        .from(taskEvents)
        .where(eq(taskEvents.taskId, taskId));
      expect(events).toHaveLength(2);
      expect(events.map((e) => e.eventType)).toContain("task_updated");
    });
  });

  describe("Security, Cross-Tenant Isolation & Validation", () => {
    it("rejects assigning to a member of a different organization with INVALID_ASSIGNEE", async () => {
      const { client } = await createConnectedClient();

      const res = (await client.callTool({
        name: "create_task",
        arguments: {
          title: "Cross-Tenant Assignee Test",
          assigneeMembershipId: orgB.memberships.priya.id, // Belonging to Org B!
        },
      })) as McpToolResult;

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("INVALID_ASSIGNEE");
      expect(res.content[0].text).toContain("Assignee must be an active member of the same organization");
    });

    it("prevents reading or updating tasks belonging to another organization", async () => {
      // Create task in Org B
      const [taskInB] = await db
        .insert(tasks)
        .values({
          organizationId: orgB.organization.id,
          title: "Org B Secret Task",
          assigneeMembershipId: orgB.memberships.priya.id,
          createdByMembershipId: orgB.leader.membershipId,
          status: "open",
        })
        .returning();

      // Client authenticated as Org A leader attempts to read Org B task
      const { client } = await createConnectedClient();

      const getRes = (await client.callTool({
        name: "get_task",
        arguments: { taskId: taskInB.id },
      })) as McpToolResult;

      expect(getRes.isError).toBe(true);
      expect(getRes.content[0].text).toContain("TASK_NOT_FOUND");

      // Attempt to update Org B task
      const updateRes = (await client.callTool({
        name: "update_task",
        arguments: {
          taskId: taskInB.id,
          title: "Tampered Title",
        },
      })) as McpToolResult;

      expect(updateRes.isError).toBe(true);
      expect(updateRes.content[0].text).toContain("TASK_NOT_FOUND");
    });

    it("rejects invalid input such as empty title or invalid UUID format", async () => {
      const { client } = await createConnectedClient();

      // Invalid UUID
      const invalidUuidRes = (await client.callTool({
        name: "get_task",
        arguments: { taskId: "not-a-valid-uuid" },
      })) as McpToolResult;

      expect(invalidUuidRes.isError).toBe(true);

      // Empty title
      const emptyTitleRes = (await client.callTool({
        name: "create_task",
        arguments: {
          title: "   ",
          assigneeMembershipId: orgA.memberships.priya.id,
        },
      })) as McpToolResult;

      expect(emptyTitleRes.isError).toBe(true);
      expect(emptyTitleRes.content[0].text).toContain("VALIDATION_ERROR");
    });
  });
});

