export type MembershipRole = "leader" | "member" | "volunteer";

export interface ActorContext {
  userId: string;
  organizationId: string;
  membershipId: string;
  role: MembershipRole;
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
