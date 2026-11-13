"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { updatePasswordAction } from "@/server/actions/auth.actions";
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[400px] border border-black dark:border-white bg-white dark:bg-black p-8 shadow-none">
        <div className="flex flex-col items-center text-center mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <Link
            href="/"
            className="mb-4 flex h-10 w-10 items-center justify-center border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black transition-colors"
          >
            <Image
              src="/assets/brand/logo.svg"
              alt="TaskPit"
              width={24}
              height={24}
              className="h-6 w-auto brightness-0 invert dark:invert-0"
              priority
            />
          </Link>
          <h1 className="text-xl font-mono font-bold uppercase tracking-wider text-foreground">
            Set New Password
          </h1>
          <p className="text-xs font-mono text-neutral-500 mt-1">
            Choose a new secure password
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black mx-auto mb-2">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-sm font-mono font-bold uppercase text-foreground">Password Updated</p>
            <p className="text-xs font-mono text-neutral-500 leading-relaxed">
              Your password has been changed successfully. You can now sign in with your new credentials.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-10"
              >
                Proceed to Sign In
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="mb-4 flex items-start gap-2 border border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 p-3 text-xs font-mono text-foreground">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground" htmlFor="password">
                New Password
              </label>
              <Input
                id="password"
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                required
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 mt-2"
            >
              <span>{isPending ? "Updating..." : "Update Password"}</span>
              {!isPending && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
