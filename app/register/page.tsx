"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Lock, Mail, User, Check } from "lucide-react";
import { signUpAction } from "@/app/actions/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <div
        className="min-h-screen flex items-center justify-center p-4 bg-background bg-cover bg-center relative"
        style={{ backgroundImage: "url('/assets/backgrounds/auth-light.webp')" }}
      >
        <div className="absolute inset-0 bg-[#fafaf9]/85 dark:bg-[#121316]/90 backdrop-blur-[2px]" />
        <div className="relative z-10 w-full max-w-sm">
          <div className="rounded-xl border border-border bg-card p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-3">
              <Check className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              We sent a verification link to <span className="font-medium text-foreground">{email}</span>.
              Please confirm your email address to complete registration.
            </p>
            <div className="mt-5">
              <Link href="/login" className="block w-full">
                <Button variant="outline" className="w-full h-9 text-xs">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-background bg-cover bg-center relative"
      style={{ backgroundImage: "url('/assets/backgrounds/auth-light.webp')" }}
    >
      <div className="absolute inset-0 bg-[#fafaf9]/85 dark:bg-[#121316]/90 backdrop-blur-[2px]" />
      <div className="relative z-10 w-full max-w-sm py-10">
        {/* Brand & Header */}
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
            Create an account
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            One account connects you to all your student clubs and organizations
          </p>
        </div>

        {/* Main Form Container */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {errorMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            <GoogleButton text="Sign up with Google" />

            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-border" />
              <span className="absolute bg-card px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                or
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground" htmlFor="displayName">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="displayName"
                    type="text"
                    required
                    placeholder="Hardik Sharma"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-9 text-xs h-9"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="hardik@organization.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs h-9"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground" htmlFor="password">
                  Password
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
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="Repeat your password"
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
                <span>{isPending ? "Creating account..." : "Create Account"}</span>
                {!isPending && <ArrowRight className="h-3.5 w-3.5" />}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
