"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { updatePasswordAction } from "@/server/actions/auth.actions";
import { AuthBackgroundKoi } from "@/components/auth/auth-background-koi";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
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
      const res = await updatePasswordAction({ password });
      if (!res.success) {
        setErrorMessage(res.error || "Failed to update password.");
      } else {
        setIsSuccess(true);
      }
    });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
      {/* Calm 3D Koi + Purple/Lilac Background */}
      <AuthBackgroundKoi />

      {/* Centered Glass Card */}
      <div className="relative z-10 w-full max-w-[440px] rounded-[24px] border border-[rgba(196,178,255,0.18)] bg-[rgba(13,8,48,0.78)] backdrop-blur-2xl p-6 sm:p-8 shadow-[0_24px_64px_rgba(5,2,25,0.65)] font-['Inter_Tight',sans-serif]">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
            <div
              className="w-8 h-8 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-105"
              style={{
                background:
                  "radial-gradient(circle at 32% 30%, #fff 0 8%, #cdb8ff 22%, #8a6cff 52%, #4b3bd6 78%)",
                boxShadow:
                  "0 0 18px rgba(160, 140, 255, 0.55), inset -3px -4px 8px rgba(40, 20, 140, 0.5)",
              }}
            />
            <span className="text-xl font-semibold tracking-tight text-[#f4f2ff]">
              TaskPit
            </span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-[#f4f2ff]">
            Set New Password
          </h1>
          <p className="text-xs text-[rgba(220,214,255,0.65)] mt-1">
            Choose a new secure password for your account
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4 text-center py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(141,148,255,0.35)] bg-[rgba(111,120,255,0.18)] text-[#8d94ff] mx-auto shadow-[0_0_20px_rgba(111,120,255,0.3)]">
              <Check className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-[#f4f2ff]">Password Updated</p>
              <p className="text-xs leading-relaxed text-[rgba(220,214,255,0.65)]">
                Your password has been changed successfully. You can now sign in with your new credentials.
              </p>
            </div>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full h-11 rounded-[12px] bg-gradient-to-r from-[#6f78ff] to-[#8d94ff] hover:from-[#7e87ff] hover:to-[#9ea4ff] text-white font-medium text-sm transition-all cursor-pointer"
              >
                Proceed to Sign In
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-[12px] border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] p-3 text-xs text-[#ffb4b4] backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#ff8080]" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                className="text-[11px] font-mono uppercase tracking-wider text-[rgba(220,214,255,0.7)]"
                htmlFor="password"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className="w-full h-11 rounded-[12px] border border-[rgba(196,178,255,0.18)] bg-[rgba(255,255,255,0.04)] px-3.5 text-sm text-[#f4f2ff] placeholder:text-[rgba(220,214,255,0.35)] focus:border-[#8d94ff] focus:ring-1 focus:ring-[#8d94ff] focus:outline-none transition-all duration-200 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-[11px] font-mono uppercase tracking-wider text-[rgba(220,214,255,0.7)]"
                htmlFor="confirmPassword"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
                className="w-full h-11 rounded-[12px] border border-[rgba(196,178,255,0.18)] bg-[rgba(255,255,255,0.04)] px-3.5 text-sm text-[#f4f2ff] placeholder:text-[rgba(220,214,255,0.35)] focus:border-[#8d94ff] focus:ring-1 focus:ring-[#8d94ff] focus:outline-none transition-all duration-200 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-[12px] bg-gradient-to-r from-[#6f78ff] to-[#8d94ff] hover:from-[#7e87ff] hover:to-[#9ea4ff] active:scale-[0.99] text-white font-medium text-sm tracking-tight flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(111,120,255,0.35)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
