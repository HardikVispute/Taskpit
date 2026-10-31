"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { signInAction } from "@/app/actions/auth";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { LiquidGlass } from "@/components/ui/liquid-glass";

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
    <LiquidGlass
      radius={28}
      bevelDepth={22}
      scale={40}
      aberration={8}
      frost={0.25}
      tint={0.16}
      className="w-full max-w-[420px] shadow-[0_24px_70px_rgba(0,0,0,0.4),0_8px_24px_rgba(219,39,119,0.2),inset_0_1.5px_1.5px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(255,255,255,0.2)] border border-white/35 backdrop-blur-2xl"
      contentClassName="p-7 sm:p-9"
    >
      {/* Brand & Header */}
      <div className="flex flex-col items-center text-center mb-7">
        <Link
          href="/"
          className="group mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 border border-white/40 shadow-[0_8px_20px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.6)] backdrop-blur-md transition-all hover:scale-105 active:scale-95"
        >
          <Image
            src="/assets/brand/logo.svg"
            alt="TaskPit"
            width={34}
            height={34}
            className="h-8 w-auto brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]"
            priority
          />
        </Link>
        <h1 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
          Sign in to TaskPit
        </h1>
        <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">
          Enter your details to access your workspace
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-300/40 bg-rose-500/25 p-3 text-xs text-white backdrop-blur-md shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-200" />
          <span className="font-medium leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Main Actions */}
      <div className="space-y-4">
        <GoogleButton
          text="Sign in with Google"
          className="h-10 sm:h-11 rounded-xl bg-white/20 hover:bg-white/30 text-white border-white/35 hover:border-white/55 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.12),inset_0_1px_0.5px_rgba(255,255,255,0.4)] font-medium text-xs tracking-wide transition-all"
        />

        <div className="relative flex items-center justify-center py-1.5">
          <div className="w-full border-t border-white/20" />
          <span className="absolute rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/85 border border-white/25 backdrop-blur-md shadow-xs">
            or
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/90 tracking-wide" htmlFor="email">
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-white/60 transition-colors group-focus-within:text-white" />
              <input
                id="email"
                type="email"
                required
                placeholder="name@organization.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                className="w-full h-10 rounded-xl bg-white/15 hover:bg-white/20 focus:bg-white/25 border border-white/25 focus:border-white/60 pl-10 pr-3.5 text-xs text-white placeholder:text-white/50 outline-none backdrop-blur-md transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] focus:ring-2 focus:ring-white/30 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/90 tracking-wide" htmlFor="password">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-white/80 hover:text-white hover:underline font-medium transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-white/60 transition-colors group-focus-within:text-white" />
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className="w-full h-10 rounded-xl bg-white/15 hover:bg-white/20 focus:bg-white/25 border border-white/25 focus:border-white/60 pl-10 pr-3.5 text-xs text-white placeholder:text-white/50 outline-none backdrop-blur-md transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] focus:ring-2 focus:ring-white/30 disabled:opacity-50"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-xl bg-white hover:bg-white/95 text-[#9d174d] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border-0 mt-2.5"
          >
            <span>{isPending ? "Signing in..." : "Continue with Email"}</span>
            {!isPending && <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-white/80 font-medium">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-white underline underline-offset-4 hover:text-white/90 transition-colors"
        >
          Create an account
        </Link>
      </div>
    </LiquidGlass>
  );
}

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#1c0710]">
      {/* Pink-Red Ambient Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat select-none"
        style={{
          backgroundImage: "url('/assets/backgrounds/auth-pink-red.webp')",
        }}
      />

      {/* Vignette & Soft Ambient Overlay */}
      <div className="absolute inset-0 bg-black/15 backdrop-blur-[1px] pointer-events-none" />

      {/* Centered Liquid Glass Panel */}
      <div className="relative z-10 w-full flex justify-center py-8">
        <Suspense fallback={<div className="text-xs text-white/70">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
