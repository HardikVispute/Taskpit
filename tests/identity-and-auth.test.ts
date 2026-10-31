import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb } from "@/lib/db";
import { organizations, organizationMemberships, users } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { TaskService } from "@/lib/services/task-service";
import { OrganizationService } from "@/lib/services/organization-service";
import { getVerifiedActorContext } from "@/lib/auth/session";
import {
  UnauthorizedError,
  NoMembershipsError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  InvalidAssigneeError,
} from "@/lib/errors";
import { eq } from "drizzle-orm";

describe("Phase 5: Unified Authentication, User Identity & Multi-Organization Selection", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;

  beforeEach(async () => {
    db = await createTestDb();
  });

  describe("1. User Identity & Profile Mapping", () => {
    it("creates a new TaskPit profile mapped to a Supabase Auth identity", async () => {
      const authIdentity = {
        id: "11111111-1111-4111-a111-111111111111",
        email: "hardik@ecell.edu",
        user_metadata: { full_name: "Hardik Sharma" },
      };

      const profile = await UserService.getOrCreateProfile(authIdentity, db);

      expect(profile).toBeDefined();
      expect(profile.supabaseAuthId).toBe(authIdentity.id);
      expect(profile.email).toBe("hardik@ecell.edu");
      expect(profile.displayName).toBe("Hardik Sharma");

      // Verify database record
      const [dbUser] = await db.select().from(users).where(eq(users.id, profile.id));
      expect(dbUser).toBeDefined();
      expect(dbUser.supabaseAuthId).toBe(authIdentity.id);
    });

    it("prevents duplicate profiles and returns the existing profile for the same Supabase Auth ID", async () => {
      const authIdentity = {
        id: "22222222-2222-4222-a222-222222222222",
        email: "priya@robotics.edu",
        user_metadata: { full_name: "Priya Sharma" },
      };

      const firstCall = await UserService.getOrCreateProfile(authIdentity, db);
      const secondCall = await UserService.getOrCreateProfile(authIdentity, db);

      expect(firstCall.id).toBe(secondCall.id);

      const allUsers = await db.select().from(users).where(eq(users.email, "priya@robotics.edu"));
      expect(allUsers).toHaveLength(1);
    });

    it("safely handles concurrent profile creation requests without duplicate records", async () => {
      const authIdentity = {
        id: "33333333-3333-4333-a333-333333333333",
        email: "alex@cultural.edu",
        user_metadata: { full_name: "Alex Rivera" },
      };

      // Execute 5 concurrent profile creation requests
      const results = await Promise.all([
        UserService.getOrCreateProfile(authIdentity, db),
        UserService.getOrCreateProfile(authIdentity, db),
        UserService.getOrCreateProfile(authIdentity, db),
        UserService.getOrCreateProfile(authIdentity, db),
        UserService.getOrCreateProfile(authIdentity, db),
      ]);

      const firstId = results[0].id;
      for (const res of results) {
        expect(res.id).toBe(firstId);
      }

      const matchingUsers = await db.select().from(users).where(eq(users.supabaseAuthId, authIdentity.id));
      expect(matchingUsers).toHaveLength(1);
    });

    it("links an unlinked pre-existing user (e.g. pre-invited) to a new Supabase Auth identity", async () => {
      // 1. Insert existing user without supabaseAuthId (simulating prior seed or invitation)
      const [preExisting] = await db
        .insert(users)
        .values({
          displayName: "Sam Logistics",
          email: "sam@taskpit.io",
        })
        .returning();

      expect(preExisting.supabaseAuthId).toBeNull();

      // 2. User registers or signs in via Supabase Auth
      const authIdentity = {
        id: "44444444-4444-4444-a444-444444444444",
        email: "sam@taskpit.io",
        user_metadata: { full_name: "Sam Patel" },
      };

      const linkedProfile = await UserService.getOrCreateProfile(authIdentity, db);

      expect(linkedProfile.id).toBe(preExisting.id);
      expect(linkedProfile.supabaseAuthId).toBe(authIdentity.id);
    });

    it("rejects claiming an email that is already linked to a different Supabase Auth ID", async () => {
      // User A creates profile with email test@taskpit.io
      await UserService.getOrCreateProfile(
        {
          id: "55555555-5555-4555-a555-555555555555",
          email: "test@taskpit.io",
        },
        db
      );

      // User B attempts to claim the same email with a different auth ID
      await expect(
        UserService.getOrCreateProfile(
          {
            id: "66666666-6666-4666-a666-666666666666",
            email: "test@taskpit.io",
          },
          db
        )
      ).rejects.toThrow(ConflictError);
    });

    it("rejects invalid auth identities missing ID or email", async () => {
      await expect(
        UserService.getOrCreateProfile({ id: "", email: "valid@test.com" }, db)
      ).rejects.toThrow(ValidationError);

      await expect(
        UserService.getOrCreateProfile({ id: "valid-id", email: "" }, db)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("2. Multi-Organization Memberships (ONE PERSON = MANY MEMBERSHIPS)", () => {
    it("supports one user account holding different roles across multiple organizations", async () => {
      // Create user
      const user = await UserService.getOrCreateProfile(
        {
          id: "77777777-7777-4777-a777-777777777777",
          email: "multi@campus.edu",
          user_metadata: { full_name: "Multi Org Student" },
        },
        db
      );

      // Create 3 organizations: E-Cell, Robotics Club, Cultural Committee
      const [ecell] = await db.insert(organizations).values({ name: "E-Cell" }).returning();
      const [robotics] = await db.insert(organizations).values({ name: "Robotics Club" }).returning();
      const [cultural] = await db.insert(organizations).values({ name: "Cultural Committee" }).returning();

      // Assign roles: E-Cell as Leader, Robotics as Member, Cultural as Volunteer
      await db.insert(organizationMemberships).values([
        { organizationId: ecell.id, userId: user.id, role: "leader" },
        { organizationId: robotics.id, userId: user.id, role: "member" },
        { organizationId: cultural.id, userId: user.id, role: "volunteer" },
      ]);

      // Retrieve all memberships for this user
      const memberships = await UserService.getUserMemberships(user.id, db);

      expect(memberships).toHaveLength(3);

      const ecellMem = memberships.find((m) => m.organizationName === "E-Cell");
      expect(ecellMem?.role).toBe("leader");

      const roboticsMem = memberships.find((m) => m.organizationName === "Robotics Club");
      expect(roboticsMem?.role).toBe("member");

      const culturalMem = memberships.find((m) => m.organizationName === "Cultural Committee");
      expect(culturalMem?.role).toBe("volunteer");
    });

    it("returns empty array for a user without any memberships", async () => {
      const user = await UserService.getOrCreateProfile(
        {
          id: "88888888-8888-4888-a888-888888888888",
          email: "solo@campus.edu",
        },
        db
      );

      const memberships = await UserService.getUserMemberships(user.id, db);
      expect(memberships).toHaveLength(0);
    });
  });

  describe("3. Organization Context Resolution & Security", () => {
    it("resolves the correct organization context and role when user selects a valid organization", async () => {
      const authIdentity = {
        id: "99999999-9999-4999-a999-999999999999",
        email: "leader.member@campus.edu",
        user_metadata: { full_name: "Hardik" },
      };

      const user = await UserService.getOrCreateProfile(authIdentity, db);

      const [ecell] = await db.insert(organizations).values({ name: "E-Cell" }).returning();
      const [robotics] = await db.insert(organizations).values({ name: "Robotics Club" }).returning();

      await db.insert(organizationMemberships).values([
        { organizationId: ecell.id, userId: user.id, role: "leader" },
        { organizationId: robotics.id, userId: user.id, role: "member" },
      ]);

      // Context resolution for E-Cell (Leader)
      const contextEcell = await getVerifiedActorContext(ecell.id, {
        dbInstance: db,
        supabaseUserOverride: authIdentity,
      });

      expect(contextEcell.actor.organizationId).toBe(ecell.id);
      expect(contextEcell.actor.role).toBe("leader");

      // Context resolution for Robotics Club (Member)
      const contextRobotics = await getVerifiedActorContext(robotics.id, {
        dbInstance: db,
        supabaseUserOverride: authIdentity,
      });

      expect(contextRobotics.actor.organizationId).toBe(robotics.id);
      expect(contextRobotics.actor.role).toBe("member");
    });

    it("throws NoMembershipsError when an authenticated user has zero memberships", async () => {
      const authIdentity = {
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        email: "newuser@campus.edu",
      };

      await expect(
        getVerifiedActorContext(undefined, {
          dbInstance: db,
          supabaseUserOverride: authIdentity,
        })
      ).rejects.toThrow(NoMembershipsError);
    });

    it("rejects unauthorized organization selection if client requests an org they do not belong to", async () => {
      const authIdentity = {
        id: "bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb",
        email: "ecell.only@campus.edu",
      };

      const user = await UserService.getOrCreateProfile(authIdentity, db);
      const [ecell] = await db.insert(organizations).values({ name: "E-Cell" }).returning();
      const [secretOrg] = await db.insert(organizations).values({ name: "Secret Society" }).returning();

      // User belongs ONLY to E-Cell
      await db.insert(organizationMemberships).values({
        organizationId: ecell.id,
        userId: user.id,
        role: "member",
      });

      // User attempts to select secretOrg
      const context = await getVerifiedActorContext(secretOrg.id, {
        dbInstance: db,
        supabaseUserOverride: authIdentity,
      });

      // Server strictly blocks access to secretOrg and falls back to their verified org
      expect(context.actor.organizationId).toBe(ecell.id);
      expect(context.actor.organizationId).not.toBe(secretOrg.id);
    });

    it("throws UnauthorizedError when session is missing completely", async () => {
      await expect(
        getVerifiedActorContext(undefined, {
          dbInstance: db,
          supabaseUserOverride: undefined,
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("4. End-to-End Role Permissions & Tenant Isolation", () => {
    it("allows task creation in E-Cell (where user is Leader) but blocks task creation in Robotics (where user is Member)", async () => {
      const authIdentity = {
        id: "cccccccc-cccc-4ccc-accc-cccccccccccc",
        email: "dual.role@campus.edu",
      };

      const user = await UserService.getOrCreateProfile(authIdentity, db);

      // Create other members to assign work to
      const [assigneeUser] = await db
        .insert(users)
        .values({ displayName: "Student Assignee", email: "assignee@campus.edu" })
        .returning();

      const [ecell] = await db.insert(organizations).values({ name: "E-Cell" }).returning();
      const [robotics] = await db.insert(organizations).values({ name: "Robotics Club" }).returning();

      // User is leader in E-Cell, member in Robotics
      await db
        .insert(organizationMemberships)
        .values({ organizationId: ecell.id, userId: user.id, role: "leader" });

      await db
        .insert(organizationMemberships)
        .values({ organizationId: robotics.id, userId: user.id, role: "member" });

      // Assignee is member in both orgs
      const [ecellAssigneeMem] = await db
        .insert(organizationMemberships)
        .values({ organizationId: ecell.id, userId: assigneeUser.id, role: "member" })
        .returning();

      const [roboticsAssigneeMem] = await db
        .insert(organizationMemberships)
        .values({ organizationId: robotics.id, userId: assigneeUser.id, role: "member" })
        .returning();

      // 1. In E-Cell: Leader creates task -> SUCCEEDS
      const ecellContext = await getVerifiedActorContext(ecell.id, {
        dbInstance: db,
        supabaseUserOverride: authIdentity,
      });

      const task = await TaskService.createTask(
        ecellContext.actor,
        {
          title: "Book Pitch Stage",
          assigneeMembershipId: ecellAssigneeMem.id,
          createdVia: "web",
        },
        db
      );

      expect(task.title).toBe("Book Pitch Stage");
      expect(task.organizationId).toBe(ecell.id);

      // 2. In Robotics: Member attempts to create task -> FAILS with ForbiddenError
      const roboticsContext = await getVerifiedActorContext(robotics.id, {
        dbInstance: db,
        supabaseUserOverride: authIdentity,
      });

      await expect(
        TaskService.createTask(
          roboticsContext.actor,
          {
            title: "Build Drone Chassis",
            assigneeMembershipId: roboticsAssigneeMem.id,
            createdVia: "web",
          },
          db
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it("prevents assigning work to an assignee belonging to a different organization", async () => {
      const authIdentity = {
        id: "dddddddd-dddd-4ddd-addd-dddddddddddd",
        email: "ecell.leader@campus.edu",
      };

      const user = await UserService.getOrCreateProfile(authIdentity, db);
      const [ecell] = await db.insert(organizations).values({ name: "E-Cell" }).returning();
      const [robotics] = await db.insert(organizations).values({ name: "Robotics Club" }).returning();

      await db.insert(organizationMemberships).values({
        organizationId: ecell.id,
        userId: user.id,
        role: "leader",
      });

      // Assignee only in Robotics
      const [otherUser] = await db.insert(users).values({ displayName: "Robo Tech", email: "robo@tech.edu" }).returning();
      const [roboticsMem] = await db.insert(organizationMemberships).values({
        organizationId: robotics.id,
        userId: otherUser.id,
        role: "member",
      }).returning();

      const ecellContext = await getVerifiedActorContext(ecell.id, {
        dbInstance: db,
        supabaseUserOverride: authIdentity,
      });

      // Attempt to assign task in E-Cell to robotics member
      await expect(
        TaskService.createTask(
          ecellContext.actor,
          {
            title: "Cross-Tenant Assignee Test",
            assigneeMembershipId: roboticsMem.id,
            createdVia: "web",
          },
          db
        )
      ).rejects.toThrow(InvalidAssigneeError);
    });
  });

  describe("4. Onboarding: Organization Creation & 2-Layered Organization Join", () => {
    it("allows a user with 0 memberships to create an organization and become Leader", async () => {
      const authIdentity = {
        id: "eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee",
        email: "founder@startup.edu",
        user_metadata: { full_name: "Hardik Vispute" },
      };

      const user = await UserService.getOrCreateProfile(authIdentity, db);
      const initialMemberships = await UserService.getUserMemberships(user.id, db);
      expect(initialMemberships).toHaveLength(0);

      // Verify that getVerifiedActorContext throws NoMembershipsError before creation
      await expect(
        getVerifiedActorContext(undefined, {
          dbInstance: db,
          supabaseUserOverride: authIdentity,
        })
      ).rejects.toThrow(NoMembershipsError);

      // Create organization
      const { organization, membership } = await OrganizationService.createOrganization(
        {
          userId: user.id,
          name: "E-Cell Incubator",
          joinCode: "ECELL-2026",
          joinSecret: "secret@ecell2026",
        },
        db
      );

      expect(organization.id).toBeDefined();
      expect(organization.name).toBe("E-Cell Incubator");
      expect(organization.joinCode).toBe("ECELL-2026");
      expect(organization.joinSecret).toBe("secret@ecell2026");

      // Verify creator is granted Leader role
      expect(membership.role).toBe("leader");
      expect(membership.userId).toBe(user.id);
      expect(membership.organizationId).toBe(organization.id);

      // Verify actor context now resolves successfully with Leader role
      const context = await getVerifiedActorContext(organization.id, {
        dbInstance: db,
        supabaseUserOverride: authIdentity,
      });

      expect(context.actor.organizationId).toBe(organization.id);
      expect(context.actor.role).toBe("leader");
      expect(context.allMemberships).toHaveLength(1);
    });

    it("auto-generates unique joinCode and joinSecret if omitted", async () => {
      const authIdentity = {
        id: "ffffffff-ffff-4fff-afff-ffffffffffff",
        email: "auto@org.edu",
      };

      const user = await UserService.getOrCreateProfile(authIdentity, db);
      const { organization, membership } = await OrganizationService.createOrganization(
        {
          userId: user.id,
          name: "Robotics Society",
        },
        db
      );

      expect(organization.joinCode).toBeDefined();
      expect(organization.joinCode).toMatch(/^ROBOT-[A-Z0-9]+$/);
      expect(organization.joinSecret).toBeDefined();
      expect(organization.joinSecret!.length).toBeGreaterThanOrEqual(4);
      expect(membership.role).toBe("leader");
    });

    it("enforces unique joinCode when creating organizations", async () => {
      const user = await UserService.getOrCreateProfile(
        { id: "10101010-1010-4010-a010-101010101010", email: "user1@org.edu" },
        db
      );

      await OrganizationService.createOrganization(
        {
          userId: user.id,
          name: "First Club",
          joinCode: "UNIQUE-CODE",
        },
        db
      );

      await expect(
        OrganizationService.createOrganization(
          {
            userId: user.id,
            name: "Second Club",
            joinCode: "UNIQUE-CODE",
          },
          db
        )
      ).rejects.toThrow(ConflictError);
    });

    it("allows joining an organization using 2-layer credentials (joinCode + joinSecret)", async () => {
      // 1. Leader creates organization
      const leader = await UserService.getOrCreateProfile(
        { id: "20202020-2020-4020-a020-202020202020", email: "leader@acm.edu" },
        db
      );
      const { organization } = await OrganizationService.createOrganization(
        {
          userId: leader.id,
          name: "ACM Student Chapter",
          joinCode: "ACM-CAMPUS",
          joinSecret: "passcode99",
        },
        db
      );

      // 2. Prospective member with 0 memberships
      const student = await UserService.getOrCreateProfile(
        { id: "30303030-3030-4030-a030-303030303030", email: "student@campus.edu" },
        db
      );

      // Test Layer 1 failure: Wrong organization code
      await expect(
        OrganizationService.joinOrganizationWithCode(
          {
            userId: student.id,
            joinCode: "WRONG-CODE",
            joinSecret: "passcode99",
          },
          db
        )
      ).rejects.toThrow(ValidationError);

      // Test Layer 2 failure: Correct code, wrong secret
      await expect(
        OrganizationService.joinOrganizationWithCode(
          {
            userId: student.id,
            joinCode: "ACM-CAMPUS",
            joinSecret: "wrong-secret",
          },
          db
        )
      ).rejects.toThrow(ValidationError);

      // Test Success: Both layers correct
      const joinResult = await OrganizationService.joinOrganizationWithCode(
        {
          userId: student.id,
          joinCode: "ACM-CAMPUS",
          joinSecret: "passcode99",
        },
        db
      );

      expect(joinResult.organization.id).toBe(organization.id);
      expect(joinResult.membership.role).toBe("member");
      expect(joinResult.membership.userId).toBe(student.id);
      expect(joinResult.alreadyMember).toBe(false);

      // 3. Student can now resolve actor context as Member
      const studentContext = await getVerifiedActorContext(organization.id, {
        dbInstance: db,
        supabaseUserOverride: { id: "30303030-3030-4030-a030-303030303030", email: "student@campus.edu" },
      });

      expect(studentContext.actor.role).toBe("member");
      expect(studentContext.actor.organizationId).toBe(organization.id);
    });

    it("idempotently returns existing membership if user rejoins an organization they belong to", async () => {
      const leader = await UserService.getOrCreateProfile(
        { id: "40404040-4040-4040-a040-404040404040", email: "admin@club.edu" },
        db
      );
      const { organization } = await OrganizationService.createOrganization(
        {
          userId: leader.id,
          name: "Design Club",
          joinCode: "DESIGN-01",
          joinSecret: "design123",
        },
        db
      );
      expect(organization.id).toBeDefined();

      const rejoinResult = await OrganizationService.joinOrganizationWithCode(
        {
          userId: leader.id,
          joinCode: "DESIGN-01",
          joinSecret: "design123",
        },
        db
      );

      expect(rejoinResult.alreadyMember).toBe(true);
      expect(rejoinResult.membership.role).toBe("leader");

      // Verify no duplicate record created
      const allMemberships = await UserService.getUserMemberships(leader.id, db);
      expect(allMemberships).toHaveLength(1);
    });
  });
});
