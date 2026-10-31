import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { ActorContext } from "@/lib/types/auth";
import { UnauthorizedError, NoMembershipsError } from "@/lib/errors";
import { UserService, UserProfile, UserOrganizationMembership, SupabaseAuthIdentity } from "@/lib/services/user-service";
import { createClient } from "@/utils/supabase/server";

export const ACTIVE_ORG_COOKIE = "taskpit_active_org_id";

export interface VerifiedActorResult {
  actor: ActorContext;
  profile: UserProfile;
  activeMembership: UserOrganizationMembership;
  allMemberships: UserOrganizationMembership[];
}

export interface GetVerifiedActorOptions {
  dbInstance?: Awaited<ReturnType<typeof getDb>>;
  supabaseUserOverride?: SupabaseAuthIdentity;
}

/**
 * Server-side identity and organization context resolution.
 *
 * 1. Resolves authenticated Supabase identity.
 * 2. Maps/resolves the TaskPit user profile in PostgreSQL.
 * 3. Retrieves all verified organization memberships belonging to the user.
 * 4. Strictly validates the selected organization against the user's memberships.
 *
 * Never trusts client-supplied actor IDs, roles, or organization IDs.
 */
export async function getVerifiedActorContext(
  requestedOrgId?: string,
  options: GetVerifiedActorOptions = {}
): Promise<VerifiedActorResult> {
  let authIdentity: SupabaseAuthIdentity | null = options.supabaseUserOverride || null;

  if (!authIdentity) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new UnauthorizedError("Authentication required. Please sign in to access TaskPit.");
      }

      authIdentity = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      };
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      throw new UnauthorizedError(
        err instanceof Error ? err.message : "Authentication required. Please sign in to access TaskPit."
      );
    }
  }

  const db = options.dbInstance ?? (await getDb());

  // Resolve application user profile
  const profile = await UserService.getOrCreateProfile(authIdentity, db);

  // Retrieve verified memberships for this user
  const allMemberships = await UserService.getUserMemberships(profile.id, db);

  if (allMemberships.length === 0) {
    throw new NoMembershipsError("No organization memberships found for this user account.");
  }

  // Determine active organization:
  // 1. Explicitly requested org ID
  // 2. Cookie 'taskpit_active_org_id'
  // 3. Fallback to first membership
  let targetOrgId = requestedOrgId;

  if (!targetOrgId) {
    try {
      const cookieStore = await cookies();
      targetOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
    } catch {
      // In non-request environments (e.g. tests), ignore cookie lookup
    }
  }

  // Strictly validate that user actually belongs to target organization
  let activeMembership = allMemberships.find((m) => m.organizationId === targetOrgId);

  // If no match (or invalid/forged cookie), fall back to user's first valid membership
  if (!activeMembership) {
    activeMembership = allMemberships[0];
  }

  const actor: ActorContext = {
    userId: profile.id,
    organizationId: activeMembership.organizationId,
    membershipId: activeMembership.membershipId,
    role: activeMembership.role,
  };

  return {
    actor,
    profile,
    activeMembership,
    allMemberships,
  };
}
