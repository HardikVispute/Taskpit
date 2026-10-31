import { redirect } from "next/navigation";
import { getVerifiedActorContext } from "@/lib/auth/session";
import { OrganizationService } from "@/lib/services/organization-service";
import { TaskService } from "@/lib/services/task-service";
import { WorkspaceHeader } from "@/components/tasks/workspace-header";
import { TaskWorkspace, TaskItem } from "@/components/tasks/task-workspace";
import { UnauthorizedError, NoMembershipsError } from "@/lib/errors";

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <WorkspaceHeader
        organizationName={organization.name}
        currentOrgId={actor.organizationId}
        currentRole={actor.role}
        currentDisplayName={profile.displayName}
        currentEmail={profile.email}
        availableMemberships={allMemberships}
        joinCode={organization.joinCode}
        joinSecret={organization.joinSecret}
      />
      <main className="flex-1">
        <TaskWorkspace
          initialTasks={tasks as TaskItem[]}
          members={members}
          currentRole={actor.role}
          currentMembershipId={actor.membershipId}
        />
      </main>
    </div>
  );
}
