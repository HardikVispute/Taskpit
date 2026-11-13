import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/server/auth/supabase-server";
import { UserService } from "@/server/services/user.service";
import { ACTIVE_ORG_COOKIE } from "@/server/auth/session";
import { OrganizationSelector } from "@/components/auth/organization-selector";
import { NoMembershipsOnboarding } from "@/components/auth/no-memberships-onboarding";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const dynamic = "force-dynamic";

export default async function SelectOrgPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await UserService.getOrCreateProfile(user);
  const memberships = await UserService.getUserMemberships(profile.id);

  if (memberships.length === 0) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <NoMembershipsOnboarding
          displayName={profile.displayName}
          email={profile.email}
        />
      </div>
    );
  }

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value || memberships[0].organizationId;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <OrganizationSelector
        memberships={memberships}
        activeOrgId={activeOrgId}
        userName={profile.displayName}
        userEmail={profile.email}
      />
    </div>
  );
}
