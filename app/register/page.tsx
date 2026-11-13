"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { signUpAction } from "@/server/actions/auth.actions";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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

  if (verificationPending) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[420px] border border-black dark:border-white bg-white dark:bg-black p-8 shadow-none text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black">
            <Check className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-mono font-bold uppercase tracking-wider text-foreground">
            Check your email
          </h1>
          <p className="mt-2 text-xs font-mono text-neutral-500">
            A verification link was sent to <strong className="text-foreground">{email}</strong>. Please confirm your email to activate your TaskPit account.
          </p>
          <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-6">
            <Link href="/login">
              <Button variant="outline" className="w-full h-10">
                Return to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[420px] border border-black dark:border-white bg-white dark:bg-black p-8 shadow-none">
        {/* Brand & Header */}
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
            TaskPit
          </h1>
          <p className="text-xs font-mono text-neutral-500 mt-1">
            Create Personal Identity
          </p>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-2 border border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 p-3 text-xs font-mono text-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Actions */}
        <div className="space-y-4">
          <GoogleButton />

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <span className="relative bg-white dark:bg-black px-2 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
              Or register with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="displayName"
                className="text-xs font-mono uppercase tracking-wider text-neutral-500"
              >
                Full Name
              </label>
              <Input
                id="displayName"
                type="text"
                placeholder="Ada Lovelace"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-xs font-mono uppercase tracking-wider text-neutral-500"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@organization.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-xs font-mono uppercase tracking-wider text-neutral-500"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-mono uppercase tracking-wider text-neutral-500"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 mt-2"
            >
              <span>{isPending ? "Creating Account..." : "Create Account"}</span>
              {!isPending && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-6 text-center text-xs font-mono text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-foreground underline underline-offset-4 hover:opacity-75 transition-opacity"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
