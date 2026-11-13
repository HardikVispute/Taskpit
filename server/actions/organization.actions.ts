"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/server/auth/supabase-server";
import { UserService } from "@/server/services/user.service";
import { OrganizationService } from "@/server/services/organization.service";
import { ACTIVE_ORG_COOKIE } from "@/server/auth/session";

export async function switchActiveOrgAction(organizationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Authentication required." };
  }

  const profile = await UserService.getOrCreateProfile(user);

  // Strict server-side verification: check that caller is an active member of target organization
  const membership = await UserService.getMembershipInOrg(profile.id, organizationId);
  if (!membership) {
    return {
      success: false as const,
      error: "Forbidden: You are not a member of the requested organization.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { success: true as const, organizationId };
}

export async function createOrganizationAction(formData: {
  name: string;
  joinCode?: string;
  joinSecret?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Authentication required." };
  }

  const profile = await UserService.getOrCreateProfile(user);

  try {
    const { organization } = await OrganizationService.createOrganization({
      userId: profile.id,
      name: formData.name,
      joinCode: formData.joinCode,
      joinSecret: formData.joinSecret,
    });

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, organization.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    revalidatePath("/", "layout");
    return { success: true as const, organizationId: organization.id };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to create organization.",
    };
  }
}

export async function joinOrganizationAction(formData: {
  joinCode: string;
  joinSecret: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Authentication required." };
  }

  const profile = await UserService.getOrCreateProfile(user);

  try {
    const { organization } = await OrganizationService.joinOrganizationWithCode({
      userId: profile.id,
      joinCode: formData.joinCode,
      joinSecret: formData.joinSecret,
    });

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, organization.id, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    revalidatePath("/", "layout");
    return { success: true as const, organizationId: organization.id };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to join organization.",
    };
  }
}

