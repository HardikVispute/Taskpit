"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import { resetPasswordAction } from "@/server/actions/auth.actions";
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
            Reset Password
          </h1>
          <p className="text-xs font-mono text-neutral-500 mt-1">
            Send password recovery link
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black mx-auto mb-2">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-sm font-mono font-bold uppercase text-foreground">Instructions Sent</p>
            <p className="text-xs font-mono text-neutral-500 leading-relaxed">
              If an account exists for <span className="font-semibold text-foreground">{email}</span>, you will receive a reset link shortly.
            </p>
            <Link href="/login" className="block w-full mt-6">
              <Button variant="outline" className="w-full h-10">
                Return to Sign In
              </Button>
            </Link>
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
              <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground" htmlFor="email">
                Registered Email
              </label>
              <Input
                id="email"
                type="email"
                required
                placeholder="name@organization.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 mt-2"
            >
              <span>{isPending ? "Sending..." : "Send Reset Link"}</span>
            </Button>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
