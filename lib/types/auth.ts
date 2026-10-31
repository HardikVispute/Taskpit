export type MembershipRole = "leader" | "member" | "volunteer";

export interface ActorContext {
  userId: string;
  organizationId: string;
  membershipId: string;
  role: MembershipRole;
}


