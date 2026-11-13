"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight } from "lucide-react";
import { signInAction } from "@/server/actions/auth.actions";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
    <div className="w-full max-w-[400px] border border-black dark:border-white bg-white dark:bg-black p-8 shadow-none">
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
          Identity & Workspace Access
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
            Or continue with password
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-mono uppercase tracking-wider text-neutral-500"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-mono text-neutral-500 hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-10 mt-2"
          >
            <span>{isPending ? "Signing In..." : "Continue with Email"}</span>
            {!isPending && <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-6 text-center text-xs font-mono text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-foreground underline underline-offset-4 hover:opacity-75 transition-opacity"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Suspense fallback={<div className="text-xs font-mono">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
