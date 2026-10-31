import crypto from "crypto";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { organizations, organizationMemberships, users } from "@/lib/db/schema";
import { ActorContext } from "@/lib/types/auth";
import { ForbiddenError, ValidationError, ConflictError } from "@/lib/errors";

export interface CreateOrganizationInput {
  userId: string;
  name: string;
  joinCode?: string;
  joinSecret?: string;
}

export interface JoinOrganizationInput {
  userId: string;
  joinCode: string;
  joinSecret: string;
}

function formatJoinCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "");
}

function generateCodeFromName(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || "ORG";
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${clean}-${rand}`;
}

function generateSecret(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export class OrganizationService {
  /**
   * Creates a new organization and grants the creator the 'leader' role.
   */
  static async createOrganization(
    input: CreateOrganizationInput,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ) {
    const db = dbInstance ?? (await getDb());
    const name = input.name?.trim();
    if (!name || name.length < 2) {
      throw new ValidationError("Organization name must be at least 2 characters.");
    }

    // Determine join code
    let joinCode: string;
    if (input.joinCode && input.joinCode.trim().length > 0) {
      joinCode = formatJoinCode(input.joinCode);
      if (joinCode.length < 3) {
        throw new ValidationError("Organization code must be at least 3 characters.");
      }
      if (joinCode.length > 32) {
        throw new ValidationError("Organization code cannot exceed 32 characters.");
      }
      const [existing] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(sql`lower(${organizations.joinCode}) = lower(${joinCode})`)
        .limit(1);
      if (existing) {
        throw new ConflictError(`Organization code '${joinCode}' is already taken.`);
      }
    } else {
      let candidate = generateCodeFromName(name);
      for (let i = 0; i < 5; i++) {
        const [existing] = await db
          .select({ id: organizations.id })
          .from(organizations)
          .where(sql`lower(${organizations.joinCode}) = lower(${candidate})`)
          .limit(1);
        if (!existing) {
          break;
        }
        candidate = generateCodeFromName(name);
      }
      joinCode = candidate;
    }

    // Determine join secret
    let joinSecret = input.joinSecret?.trim();
    if (joinSecret) {
      if (joinSecret.length < 4) {
        throw new ValidationError("Organization secret code must be at least 4 characters.");
      }
      if (joinSecret.length > 64) {
        throw new ValidationError("Organization secret code cannot exceed 64 characters.");
      }
    } else {
      joinSecret = generateSecret();
    }

    return await db.transaction(async (tx) => {
      const [newOrg] = await tx
        .insert(organizations)
        .values({
          name,
          joinCode,
          joinSecret,
        })
        .returning();

      const [membership] = await tx
        .insert(organizationMemberships)
        .values({
          organizationId: newOrg.id,
          userId: input.userId,
          role: "leader",
        })
        .returning();

      return {
        organization: newOrg,
        membership,
      };
    });
  }

  /**
   * Joins an organization via a 2-layered credential check:
   * Layer 1: Organization Code (joinCode)
   * Layer 2: Organization Secret Code (joinSecret)
   *
   * Users who are already members have their membership returned.
   * New users are added with the 'member' role.
   */
  static async joinOrganizationWithCode(
    input: JoinOrganizationInput,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ) {
    const db = dbInstance ?? (await getDb());
    const joinCode = input.joinCode?.trim();
    const joinSecret = input.joinSecret?.trim();

    if (!joinCode) {
      throw new ValidationError("Organization code is required.");
    }
    if (!joinSecret) {
      throw new ValidationError("Organization secret code is required.");
    }

    // Layer 1: Find organization by code (case-insensitive)
    const [org] = await db
      .select()
      .from(organizations)
      .where(sql`lower(${organizations.joinCode}) = lower(${joinCode})`)
      .limit(1);

    if (!org) {
      throw new ValidationError("Invalid organization code. Organization not found.");
    }

    // Layer 2: Verify secret code using timing-safe comparison
    if (!org.joinSecret || !timingSafeMatch(org.joinSecret, joinSecret)) {
      throw new ValidationError("Invalid organization secret code.");
    }

    // Check if user is already a member
    const [existingMembership] = await db
      .select()
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, org.id),
          eq(organizationMemberships.userId, input.userId)
        )
      )
      .limit(1);

    if (existingMembership) {
      return {
        organization: org,
        membership: existingMembership,
        alreadyMember: true,
      };
    }

    // Create new membership with role 'member'
    const [newMembership] = await db
      .insert(organizationMemberships)
      .values({
        organizationId: org.id,
        userId: input.userId,
        role: "member",
      })
      .returning();

    return {
      organization: org,
      membership: newMembership,
      alreadyMember: false,
    };
  }

  /**
   * Retrieves organization details for an authorized actor.
   */
  static async getOrganization(
    actor: ActorContext,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ) {
    const db = dbInstance ?? (await getDb());

    const [org] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        joinCode: organizations.joinCode,
        joinSecret: organizations.joinSecret,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(eq(organizations.id, actor.organizationId))
      .limit(1);

    if (!org) {
      throw new ForbiddenError("Organization not found or access denied.");
    }

    return {
      id: org.id,
      name: org.name,
      joinCode: org.joinCode,
      // Only leaders can view the organization join secret code
      joinSecret: actor.role === "leader" ? org.joinSecret : null,
      createdAt: org.createdAt,
    };
  }

  /**
   * Lists active members of the organization for assignment selection.
   */
  static async listMembers(
    actor: ActorContext,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ) {
    const db = dbInstance ?? (await getDb());

    return await db
      .select({
        membershipId: organizationMemberships.id,
        userId: users.id,
        displayName: users.displayName,
        email: users.email,
        role: organizationMemberships.role,
        joinedAt: organizationMemberships.createdAt,
      })
      .from(organizationMemberships)
      .innerJoin(users, eq(organizationMemberships.userId, users.id))
      .where(eq(organizationMemberships.organizationId, actor.organizationId))
      .orderBy(users.displayName);
  }

  /**
   * Helper to seed a standard test organization with a leader and members.
   * Useful for local development and test scenarios.
   */
  static async seedTestOrganization(
    dbInstance?: Awaited<ReturnType<typeof getDb>>,
    orgName = "ACM Student Chapter"
  ) {
    const db = dbInstance ?? (await getDb());

    return await db.transaction(async (tx) => {
      // 1. Create Organization
      const [org] = await tx
        .insert(organizations)
        .values({
          name: orgName,
          joinCode: `ACM-${Date.now().toString(36).toUpperCase()}`,
          joinSecret: "acm-secret",
        })
        .returning();

      // 2. Create Users
      const [leaderUser] = await tx
        .insert(users)
        .values({
          displayName: "Hardik (Lead Organizer)",
          email: `leader-${Date.now()}@test.taskpit.io`,
        })
        .returning();

      const [memberPriya] = await tx
        .insert(users)
        .values({
          displayName: "Priya Sharma (Tech Lead)",
          email: `priya-${Date.now()}@test.taskpit.io`,
        })
        .returning();

      const [memberAlex] = await tx
        .insert(users)
        .values({
          displayName: "Alex Rivera (Design & Media)",
          email: `alex-${Date.now()}@test.taskpit.io`,
        })
        .returning();

      const [memberSam] = await tx
        .insert(users)
        .values({
          displayName: "Sam Patel (Logistics)",
          email: `sam-${Date.now()}@test.taskpit.io`,
        })
        .returning();

      // 3. Create Memberships
      const [leaderMembership] = await tx
        .insert(organizationMemberships)
        .values({
          organizationId: org.id,
          userId: leaderUser.id,
          role: "leader",
        })
        .returning();

      const [priyaMembership] = await tx
        .insert(organizationMemberships)
        .values({
          organizationId: org.id,
          userId: memberPriya.id,
          role: "member",
        })
        .returning();

      const [alexMembership] = await tx
        .insert(organizationMemberships)
        .values({
          organizationId: org.id,
          userId: memberAlex.id,
          role: "member",
        })
        .returning();

      const [samMembership] = await tx
        .insert(organizationMemberships)
        .values({
          organizationId: org.id,
          userId: memberSam.id,
          role: "member",
        })
        .returning();

      const leaderActor: ActorContext = {
        userId: leaderUser.id,
        organizationId: org.id,
        membershipId: leaderMembership.id,
        role: "leader",
      };

      const memberActor: ActorContext = {
        userId: memberPriya.id,
        organizationId: org.id,
        membershipId: priyaMembership.id,
        role: "member",
      };

      return {
        organization: org,
        leader: leaderActor,
        member: memberActor,
        memberships: {
          leader: leaderMembership,
          priya: priyaMembership,
          alex: alexMembership,
          sam: samMembership,
        },
      };
    });
  }
}
