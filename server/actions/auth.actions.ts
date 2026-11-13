"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/server/auth/supabase-server";
import { UserService } from "@/server/services/user.service";
import { ACTIVE_ORG_COOKIE } from "@/server/auth/session";
import {
  loginSchema,
  registerSchema,
  emailSchema,
  passwordSchema,
} from "@/shared/validation/auth.validation";


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
    redirectUrl: memberships.length > 0 ? "/workspace" : "/select-org",
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
