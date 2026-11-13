import { redirect } from "next/navigation";
import { getVerifiedActorContext } from "@/server/auth/session";
import { OrganizationService } from "@/server/services/organization.service";
import { TaskService } from "@/server/services/task.service";
import { UnauthorizedError, NoMembershipsError } from "@/shared/errors";
import { AppShell } from "@/components/layout/app-shell";
import { TaskWorkspace } from "@/components/tasks/task-workspace";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let context;
  try {
    context = await getVerifiedActorContext();
  } catch (err: unknown) {
    if (err instanceof NoMembershipsError) {
      redirect("/select-org");
    }
    if (err instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw err;
  }

  const { actor, profile, allMemberships } = context;

  const [organization, members, tasks] = await Promise.all([
    OrganizationService.getOrganization(actor),
    OrganizationService.listMembers(actor),
    TaskService.listTasks(actor),
  ]);

  const formattedMemberships = allMemberships.map((m) => ({
    id: m.membershipId,
    organizationId: m.organizationId,
    organizationName: m.organizationName,
    role: m.role,
  }));

  return (
    <AppShell
      currentDisplayName={profile.displayName}
      currentEmail={profile.email}
      currentOrgId={actor.organizationId}
      currentOrgName={organization.name}
      currentRole={actor.role}
      availableMemberships={formattedMemberships}
    >
      <TaskWorkspace
        initialTasks={tasks}
        members={members}
        currentRole={actor.role}
        currentMembershipId={actor.membershipId}
      />
    </AppShell>
  );
}
