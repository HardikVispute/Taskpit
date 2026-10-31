"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { UserService } from "@/lib/services/user-service";
import { OrganizationService } from "@/lib/services/organization-service";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function signInAction(formData: { email: string; password: string }) {
  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { success: false as const, error: error?.message || "Invalid email or password." };
  }

  // Ensure application user profile exists
  const profile = await UserService.getOrCreateProfile({
    id: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata,
  });

  const memberships = await UserService.getUserMemberships(profile.id);

  if (memberships.length > 0) {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, memberships[0].organizationId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  revalidatePath("/", "layout");
  return {
    success: true as const,
    redirectUrl: memberships.length > 0 ? "/" : "/select-org",
  };
}

export async function signUpAction(formData: {
  displayName: string;
  email: string;
  password: string;
}) {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.displayName,
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  if (data.user) {
    await UserService.getOrCreateProfile({
      id: data.user.id,
      email: data.user.email,
      user_metadata: {
        full_name: parsed.data.displayName,
        display_name: parsed.data.displayName,
      },
    });
  }

  // If email confirmation is required by Supabase project settings
  const requiresVerification = !data.session;

  return {
    success: true as const,
    requiresVerification,
    redirectUrl: requiresVerification ? null : "/select-org",
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPasswordAction(formData: { email: string }) {
  const parsed = emailSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || headersList.get("host") || "http://localhost:3000";
  const normalizedOrigin = origin.startsWith("http") ? origin : `http://${origin}`;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${normalizedOrigin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export async function updatePasswordAction(formData: { password: string }) {
  const parsed = passwordSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

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


