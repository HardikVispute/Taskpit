import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, organizationMemberships, organizations } from "@/lib/db/schema";
import { ConflictError, ValidationError } from "@/lib/errors";
import { MembershipRole } from "@/lib/types/auth";

export interface SupabaseAuthIdentity {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    display_name?: string;
    name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  } | null;
}

export interface UserProfile {
  id: string;
  supabaseAuthId: string | null;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserOrganizationMembership {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  role: MembershipRole;
  createdAt: Date;
}

export class UserService {
  /**
   * Resolves or creates a TaskPit application user profile mapped to an authenticated Supabase identity.
   * Safe under concurrent requests and race conditions.
   * Never overwrites existing identities or assigns privileged roles.
   */
  static async getOrCreateProfile(
    authIdentity: SupabaseAuthIdentity,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ): Promise<UserProfile> {
    const db = dbInstance ?? (await getDb());

    if (!authIdentity.id) {
      throw new ValidationError("Invalid auth identity: ID is required.");
    }

    const email = authIdentity.email?.toLowerCase().trim();
    if (!email) {
      throw new ValidationError("Invalid auth identity: Email is required.");
    }

    // 1. Check if user already exists with this Supabase Auth ID
    const [existingByAuthId] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseAuthId, authIdentity.id))
      .limit(1);

    if (existingByAuthId) {
      // Sync display name or avatar if provided in metadata and currently empty
      const metadataName =
        authIdentity.user_metadata?.full_name ||
        authIdentity.user_metadata?.display_name ||
        authIdentity.user_metadata?.name;
      const metadataAvatar = authIdentity.user_metadata?.avatar_url;

      if ((metadataName && !existingByAuthId.displayName) || (metadataAvatar && !existingByAuthId.avatarUrl)) {
        const [updated] = await db
          .update(users)
          .set({
            displayName: metadataName || existingByAuthId.displayName,
            avatarUrl: metadataAvatar || existingByAuthId.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingByAuthId.id))
          .returning();
        return updated;
      }
      return existingByAuthId;
    }

    // 2. Check if a pre-existing user record exists by email (e.g. from prior invitations or seed)
    const [existingByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingByEmail) {
      // If the email row is unlinked (supabaseAuthId is null), link it securely to this Supabase ID
      if (!existingByEmail.supabaseAuthId) {
        const [linked] = await db
          .update(users)
          .set({
            supabaseAuthId: authIdentity.id,
            avatarUrl: authIdentity.user_metadata?.avatar_url || existingByEmail.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingByEmail.id))
          .returning();
        return linked;
      }

      // If already linked to a DIFFERENT Supabase Auth ID, disallow claiming
      if (existingByEmail.supabaseAuthId !== authIdentity.id) {
        throw new ConflictError(
          "Account conflict: This email address is already linked to another authentication identity."
        );
      }

      return existingByEmail;
    }

    // 3. Insert new user profile with conflict handling for concurrency
    const displayName =
      authIdentity.user_metadata?.full_name ||
      authIdentity.user_metadata?.display_name ||
      authIdentity.user_metadata?.name ||
      email.split("@")[0];

    try {
      const [created] = await db
        .insert(users)
        .values({
          supabaseAuthId: authIdentity.id,
          displayName,
          email,
          avatarUrl: authIdentity.user_metadata?.avatar_url || null,
        })
        .onConflictDoUpdate({
          target: users.supabaseAuthId,
          set: {
            updatedAt: new Date(),
          },
        })
        .returning();

      return created;
    } catch {
      // Concurrency fallback: if insert encountered a race condition on unique email, re-fetch
      const [retryUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (retryUser) {
        if (!retryUser.supabaseAuthId) {
          const [linked] = await db
            .update(users)
            .set({
              supabaseAuthId: authIdentity.id,
              updatedAt: new Date(),
            })
            .where(eq(users.id, retryUser.id))
            .returning();
          return linked;
        }
        return retryUser;
      }
      throw new ConflictError("Failed to create user profile due to concurrent registration conflict.");
    }
  }

  /**
   * Retrieves all active organization memberships belonging to a TaskPit user.
   * Joins organizations table to provide full workspace details.
   */
  static async getUserMemberships(
    userId: string,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ): Promise<UserOrganizationMembership[]> {
    const db = dbInstance ?? (await getDb());

    const records = await db
      .select({
        membershipId: organizationMemberships.id,
        organizationId: organizationMemberships.organizationId,
        organizationName: organizations.name,
        role: organizationMemberships.role,
        createdAt: organizationMemberships.createdAt,
      })
      .from(organizationMemberships)
      .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
      .where(eq(organizationMemberships.userId, userId))
      .orderBy(organizations.name);

    return records as UserOrganizationMembership[];
  }

  /**
   * Checks whether a user is an active member of a specific organization.
   * Returns membership details or null if unauthorized.
   */
  static async getMembershipInOrg(
    userId: string,
    organizationId: string,
    dbInstance?: Awaited<ReturnType<typeof getDb>>
  ): Promise<UserOrganizationMembership | null> {
    const db = dbInstance ?? (await getDb());

    const [record] = await db
      .select({
        membershipId: organizationMemberships.id,
        organizationId: organizationMemberships.organizationId,
        organizationName: organizations.name,
        role: organizationMemberships.role,
        createdAt: organizationMemberships.createdAt,
      })
      .from(organizationMemberships)
      .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
      .where(
        and(
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.organizationId, organizationId)
        )
      )
      .limit(1);

    return (record as UserOrganizationMembership) || null;
  }
}

