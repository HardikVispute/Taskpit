import { MembershipRole } from "./auth.types";

export interface TaskItem {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  assigneeMembershipId: string;
  createdByMembershipId: string;
  dueAt: Date | string | null;
  status: string;
  createdVia: "web" | "mcp";
  createdAt: Date | string;
  updatedAt: Date | string;
  assigneeName: string;
}

export interface MemberItem {
  membershipId: string;
  userId: string;
  displayName: string;
  email: string;
  role: MembershipRole;
}

export interface HistoryEventItem {
  id: string;
  taskId: string;
  actorMembershipId: string | null;
  eventType: string;
  details: unknown;
  createdAt: Date | string;
  actorName: string | null;
}

