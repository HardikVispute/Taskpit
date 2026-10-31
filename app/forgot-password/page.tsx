"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, ArrowLeft, Mail, Check } from "lucide-react";
import { resetPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await resetPasswordAction({ email });
      if (!res.success) {
        setErrorMessage(res.error || "Failed to send password reset email.");
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
            Reset password
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Enter your email and we&apos;ll send instructions to reset your password
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-2">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">Instructions sent</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, you will receive a reset link shortly.
              </p>
              <Link href="/login" className="block w-full mt-4">
                <Button variant="outline" className="w-full h-9 text-xs">
                  Return to Sign In
                </Button>
              </Link>
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
                <label className="text-xs font-medium text-foreground" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="name@organization.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs h-9"
                    disabled={isPending}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-9 font-medium text-xs mt-2"
              >
                {isPending ? "Sending link..." : "Send Reset Link"}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  <ArrowLeft className="h-3 w-3" />
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
