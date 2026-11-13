import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/server/auth/supabase-server";
import { UserService } from "@/server/services/user.service";
import { ACTIVE_ORG_COOKIE } from "@/server/auth/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/workspace";
  const errorDescription = searchParams.get("error_description") || searchParams.get("error");

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          error?.message || "Failed to exchange authorization code for session."
        )}`
      );
    }

    try {
      // Map user identity and fetch organization memberships
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

      const redirectPath = memberships.length > 0 ? (next === "/" ? "/workspace" : next) : "/select-org";
      return NextResponse.redirect(`${origin}${redirectPath}`);
    } catch {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Failed to establish user profile.")}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}

