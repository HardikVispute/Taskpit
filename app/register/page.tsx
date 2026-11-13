"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2, Mail } from "lucide-react";
import { signUpAction } from "@/server/actions/auth.actions";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthIntroPanel } from "@/components/auth/auth-intro-panel";
import { AuthBackgroundKoi } from "@/components/auth/auth-background-koi";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      const res = await signUpAction({ displayName, email, password });
      if (!res.success) {
        setErrorMessage(res.error || "Failed to create account.");
      } else if (res.requiresVerification) {
        setVerificationPending(true);
      } else {
        router.push(res.redirectUrl || "/select-org");
        router.refresh();
      }
    });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Calm 3D Koi + Purple/Lilac Background */}
      <AuthBackgroundKoi />

      {/* Two-Panel Glass Container */}
      <div className="relative z-10 w-full max-w-[1020px] rounded-[24px] border border-[rgba(196,178,255,0.18)] bg-[rgba(13,8,48,0.76)] backdrop-blur-2xl shadow-[0_24px_64px_rgba(5,2,25,0.65)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Panel: Register Form or Verification Banner */}
          <div className="border-b lg:border-b-0 lg:border-r border-[rgba(196,178,255,0.12)] p-6 sm:p-8 md:p-10 font-['Inter_Tight',sans-serif] flex flex-col justify-center">
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

            {verificationPending ? (
              /* Verification Screen */
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(141,148,255,0.35)] bg-[rgba(111,120,255,0.18)] text-[#8d94ff] shadow-[0_0_24px_rgba(111,120,255,0.3)]">
                  <Mail className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-semibold tracking-tight text-[#f4f2ff]">
                    Check your email
                  </h1>
                  <p className="text-xs text-[rgba(220,214,255,0.65)] leading-relaxed max-w-sm mx-auto">
                    We sent a verification link to{" "}
                    <strong className="text-[#f4f2ff]">{email}</strong>.
                    Confirm your address to activate your account and join your organization.
                  </p>
                </div>
                <div className="pt-4">
                  <Link href="/login" className="block w-full">
                    <button
                      type="button"
                      className="w-full h-11 rounded-[12px] border border-[rgba(196,178,255,0.22)] bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#f4f2ff] text-sm font-medium transition-all"
                    >
                      Return to Sign In
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              /* Normal Register Form */
              <div>
                {/* Heading & Subtitle */}
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold tracking-tight text-[#f4f2ff]">
                    Create your account
                  </h1>
                  <p className="text-xs text-[rgba(220,214,255,0.65)] mt-1">
                    Join your organization and start executing
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
                  <GoogleButton text="Sign up with Google" />

                  {/* Divider */}
                  <div className="relative flex items-center justify-center py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[rgba(196,178,255,0.14)]" />
                    </div>
                    <span className="relative bg-[#130d3d]/90 px-3 text-[10.5px] font-mono uppercase tracking-wider text-[rgba(220,214,255,0.5)]">
                      or register with email
                    </span>
                  </div>

                  {/* Register Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="displayName"
                        className="text-[11px] font-mono uppercase tracking-wider text-[rgba(220,214,255,0.7)]"
                      >
                        Full Name
                      </label>
                      <input
                        id="displayName"
                        type="text"
                        placeholder="Ada Lovelace"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isPending}
                        required
                        className="w-full h-10 rounded-[12px] border border-[rgba(196,178,255,0.18)] bg-[rgba(255,255,255,0.04)] px-3.5 text-sm text-[#f4f2ff] placeholder:text-[rgba(220,214,255,0.35)] focus:border-[#8d94ff] focus:ring-1 focus:ring-[#8d94ff] focus:outline-none transition-all duration-200 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-1">
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
                        className="w-full h-10 rounded-[12px] border border-[rgba(196,178,255,0.18)] bg-[rgba(255,255,255,0.04)] px-3.5 text-sm text-[#f4f2ff] placeholder:text-[rgba(220,214,255,0.35)] focus:border-[#8d94ff] focus:ring-1 focus:ring-[#8d94ff] focus:outline-none transition-all duration-200 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="password"
                        className="text-[11px] font-mono uppercase tracking-wider text-[rgba(220,214,255,0.7)]"
                      >
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isPending}
                        required
                        className="w-full h-10 rounded-[12px] border border-[rgba(196,178,255,0.18)] bg-[rgba(255,255,255,0.04)] px-3.5 text-sm text-[#f4f2ff] placeholder:text-[rgba(220,214,255,0.35)] focus:border-[#8d94ff] focus:ring-1 focus:ring-[#8d94ff] focus:outline-none transition-all duration-200 disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="confirmPassword"
                        className="text-[11px] font-mono uppercase tracking-wider text-[rgba(220,214,255,0.7)]"
                      >
                        Confirm Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isPending}
                        required
                        className="w-full h-10 rounded-[12px] border border-[rgba(196,178,255,0.18)] bg-[rgba(255,255,255,0.04)] px-3.5 text-sm text-[#f4f2ff] placeholder:text-[rgba(220,214,255,0.35)] focus:border-[#8d94ff] focus:ring-1 focus:ring-[#8d94ff] focus:outline-none transition-all duration-200 disabled:opacity-50"
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
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Switch to Login */}
                <div className="mt-6 border-t border-[rgba(196,178,255,0.12)] pt-5 text-center text-xs text-[rgba(220,214,255,0.65)]">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-[#8d94ff] hover:text-[#c6b8ff] underline underline-offset-4 transition-colors"
                  >
                    Sign in
                  </Link>
                </div>

                {/* Subtle Terms Note */}
                <p className="mt-4 text-[10.5px] text-center text-[rgba(220,214,255,0.4)]">
                  By registering, you agree to TaskPit&apos;s terms of service and organizational guidelines.
                </p>
              </div>
            )}
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
