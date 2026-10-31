import { getDb } from "@/lib/db";
import { organizations, organizationMemberships } from "@/lib/db/schema";
import { ActorContext } from "@/lib/types/auth";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { OrganizationService } from "@/lib/services/organization-service";
import { eq, and } from "drizzle-orm";

/**
 * DEVELOPMENT ONLY AUTHENTICATION:
 * In local development and prototype testing, external MCP clients authenticate
 * via TASKPIT_API_KEY environment variable.
 *
 * This key maps deterministically to an authorized Leader membership in the
 * designated test organization. The MCP client cannot choose arbitrary actors,
 * roles, or organization IDs.
 *
 * PRODUCTION NOTE:
 * In production, this will be replaced by cryptographic per-user API tokens or
 * OAuth 2.0 access tokens mapped to verified user memberships in the database.
 */
export async function resolveMcpActor(
  apiKey?: string,
  dbInstance?: Awaited<ReturnType<typeof getDb>>
): Promise<ActorContext> {
  const isProduction = process.env.NODE_ENV === "production";
  const expectedKey =
    process.env.TASKPIT_API_KEY || (isProduction ? undefined : "tp_dev_test_placeholder_key");

  if (!expectedKey) {
    throw new UnauthorizedError(
      "MCP authentication failed: TASKPIT_API_KEY must be configured in production environments."
    );
  }

  if (!apiKey || apiKey !== expectedKey) {
    throw new UnauthorizedError(
      "MCP authentication failed: Invalid or missing TASKPIT_API_KEY."
    );
  }

  const db = dbInstance ?? (await getDb());

  // Ensure test organization exists
  let [org] = await db.select().from(organizations).limit(1);
  if (!org) {
    const seeded = await OrganizationService.seedTestOrganization(db);
    org = seeded.organization;
  }

  // Resolve leader membership for the organization
  const [leaderMembership] = await db
    .select({
      id: organizationMemberships.id,
      userId: organizationMemberships.userId,
      organizationId: organizationMemberships.organizationId,
      role: organizationMemberships.role,
    })
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.organizationId, org.id),
        eq(organizationMemberships.role, "leader")
      )
    )
    .limit(1);

  if (!leaderMembership) {
    throw new ForbiddenError(
      "MCP authentication failed: No authorized leader membership found for organization."
    );
  }

  return {
    userId: leaderMembership.userId,
    organizationId: leaderMembership.organizationId,
    membershipId: leaderMembership.id,
    role: leaderMembership.role,
  };
}

