import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { UserService } from "@/lib/services/user-service";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/session";
import { OrganizationSelector } from "@/components/auth/organization-selector";
import { NoMembershipsOnboarding } from "@/components/auth/no-memberships-onboarding";

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <OrganizationSelector
        memberships={memberships}
        activeOrgId={activeOrgId}
        userName={profile.displayName}
        userEmail={profile.email}
      />
    </div>
  );
}

