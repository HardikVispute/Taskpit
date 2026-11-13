"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { signInAction } from "@/server/actions/auth.actions";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthIntroPanel } from "@/components/auth/auth-intro-panel";
import { AuthBackgroundKoi } from "@/components/auth/auth-background-koi";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(urlError);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await signInAction({ email, password });
      if (!res.success) {
        setErrorMessage(res.error || "Failed to sign in.");
      } else {
        router.push(res.redirectUrl);
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full flex flex-col justify-center p-6 sm:p-8 md:p-10 font-['Inter_Tight',sans-serif]">
      {/* Brand & Wordmark */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div
            className="w-7 h-7 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{
              background:
                "radial-gradient(circle at 32% 30%, #fff 0 8%, #cdb8ff 22%, #8a6cff 52%, #4b3bd6 78%)",
              boxShadow:
                "0 0 16px rgba(160, 140, 255, 0.55), inset -3px -4px 8px rgba(40, 20, 140, 0.5)",
            }}
          />
          <span className="text-xl font-semibold tracking-tight text-[#f4f2ff]">
            TaskPit
          </span>
        </Link>
      </div>

      {/* Heading & Subtitle */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[#f4f2ff]">
          Welcome back
        </h1>
        <p className="text-xs text-[rgba(220,214,255,0.65)] mt-1">
          Sign in to access your organization workspace
        </p>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mb-5 flex items-start gap-2.5 rounded-[12px] border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] p-3 text-xs text-[#ffb4b4] backdrop-blur-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#ff8080]" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Auth Actions */}
      <div className="space-y-4">
        {/* Google OAuth */}
        <GoogleButton text="Continue with Google" />

        {/* Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[rgba(196,178,255,0.14)]" />
          </div>
          <span className="relative bg-[#130d3d]/90 px-3 text-[10.5px] font-mono uppercase tracking-wider text-[rgba(220,214,255,0.5)]">
            or continue with email
          </span>
        </div>

        {/* Password Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-[11px] font-mono uppercase tracking-wider text-[rgba(220,214,255,0.7)]"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@organization.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
              className="w-full h-11 rounded-[12px] border border-[rgba(196,178,255,0.18)] bg-[rgba(255,255,255,0.04)] px-3.5 text-sm text-[#f4f2ff] placeholder:text-[rgba(220,214,255,0.35)] focus:border-[#8d94ff] focus:ring-1 focus:ring-[#8d94ff] focus:outline-none transition-all duration-200 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-[11px] font-mono uppercase tracking-wider text-[rgba(220,214,255,0.7)]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#8d94ff] hover:text-[#b4baff] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              required
              className="w-full h-11 rounded-[12px] border border-[rgba(196,178,255,0.18)] bg-[rgba(255,255,255,0.04)] px-3.5 text-sm text-[#f4f2ff] placeholder:text-[rgba(220,214,255,0.35)] focus:border-[#8d94ff] focus:ring-1 focus:ring-[#8d94ff] focus:outline-none transition-all duration-200 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 mt-1 rounded-[12px] bg-gradient-to-r from-[#6f78ff] to-[#8d94ff] hover:from-[#7e87ff] hover:to-[#9ea4ff] active:scale-[0.99] text-white font-medium text-sm tracking-tight flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(111,120,255,0.35)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Continue with Email</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Switch to Register */}
      <div className="mt-6 border-t border-[rgba(196,178,255,0.12)] pt-5 text-center text-xs text-[rgba(220,214,255,0.65)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-[#8d94ff] hover:text-[#c6b8ff] underline underline-offset-4 transition-colors"
        >
          Create account
        </Link>
      </div>

      {/* Subtle Privacy / Terms Note */}
      <p className="mt-4 text-[10.5px] text-center text-[rgba(220,214,255,0.4)]">
        By signing in, you agree to TaskPit&apos;s organization terms and security policies.
      </p>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Calm 3D Koi + Purple/Lilac Background */}
      <AuthBackgroundKoi />

      {/* Two-Panel Glass Container */}
      <div className="relative z-10 w-full max-w-[1020px] rounded-[24px] border border-[rgba(196,178,255,0.18)] bg-[rgba(13,8,48,0.76)] backdrop-blur-2xl shadow-[0_24px_64px_rgba(5,2,25,0.65)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Panel: Auth Form */}
          <div className="border-b lg:border-b-0 lg:border-r border-[rgba(196,178,255,0.12)]">
            <Suspense
              fallback={
                <div className="p-10 text-center text-xs font-mono text-[rgba(220,214,255,0.6)]">
                  Loading sign in...
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>

          {/* Right Panel: TaskPit Introduction */}
          <div className="bg-gradient-to-br from-[rgba(111,120,255,0.06)] to-[rgba(26,16,72,0.2)]">
            <AuthIntroPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
