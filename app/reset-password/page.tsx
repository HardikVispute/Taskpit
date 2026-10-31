"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Lock, Check } from "lucide-react";
import { updatePasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-background bg-cover bg-center relative"
      style={{ backgroundImage: "url('/assets/backgrounds/auth-light.webp')" }}
    >
      <div className="absolute inset-0 bg-[#fafaf9]/85 dark:bg-[#121316]/90 backdrop-blur-[2px]" />
      <div className="relative z-10 w-full max-w-sm py-10">
        <div className="flex flex-col items-center text-center mb-7">
          <Link href="/" className="inline-block mb-3.5 transition-opacity hover:opacity-85">
            <Image
              src="/assets/brand/logo.svg"
              alt="TaskPit"
              width={40}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Set new password
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Choose a new secure password for your TaskPit account
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-2">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">Password updated</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your password has been changed successfully. You can now sign in with your new credentials.
              </p>
              <Button
                onClick={() => {
                  router.push("/login");
                  router.refresh();
                }}
                className="w-full h-9 text-xs mt-4"
              >
                Go to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground" htmlFor="password">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs h-9"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 text-xs h-9"
                    disabled={isPending}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-9 font-medium text-xs flex items-center justify-center gap-1.5 mt-3"
              >
                <span>{isPending ? "Updating password..." : "Update Password"}</span>
                {!isPending && <ArrowRight className="h-3.5 w-3.5" />}
              </Button>

              <div className="pt-2 text-center text-xs">
                <Link href="/login" className="text-muted-foreground hover:text-foreground">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
