"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  ShieldCheck,
  PlusCircle,
  LogIn,
  AlertCircle,
  Hash,
  Lock,
  Mail,
  Building2,
} from "lucide-react";
import {
  createOrganizationAction,
  joinOrganizationAction,
} from "@/server/actions/organization.actions";
import { signOutAction } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NoMembershipsOnboardingProps {
  displayName: string;
  email: string;
}

export function NoMembershipsOnboarding({
  displayName,
  email,
}: NoMembershipsOnboardingProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createSecret, setCreateSecret] = useState("");

  const [joinCode, setJoinCode] = useState("");
  const [joinSecret, setJoinSecret] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!createName.trim()) {
      setErrorMessage("Please enter an organization name.");
      return;
    }

    startTransition(async () => {
      const res = await createOrganizationAction({
        name: createName,
        joinCode: createCode.trim() || undefined,
        joinSecret: createSecret.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to create organization.");
      } else {
        router.push("/workspace");
        router.refresh();
      }
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!joinCode.trim()) {
      setErrorMessage("Please enter the organization code (Layer 1).");
      return;
    }

    if (!joinSecret.trim()) {
      setErrorMessage("Please enter the secret passcode (Layer 2).");
      return;
    }

    startTransition(async () => {
      const res = await joinOrganizationAction({
        joinCode: joinCode.trim(),
        joinSecret: joinSecret.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || "Invalid organization code or secret.");
      } else {
        router.push("/workspace");
        router.refresh();
      }
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <div className="w-full max-w-[440px] mx-auto py-12 px-4">
      {/* Brand & Header */}
      <div className="text-center mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <Link href="/" className="inline-block mb-3">
          <div className="flex h-10 w-10 items-center justify-center border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black mx-auto">
            <Image
              src="/assets/brand/logo.svg"
              alt="TaskPit"
              width={24}
              height={24}
              className="h-6 w-auto brightness-0 invert dark:invert-0"
              priority
            />
          </div>
        </Link>
        <h1 className="text-lg font-mono font-bold uppercase tracking-wider text-foreground">
          Welcome, {displayName}
        </h1>
        <p className="text-xs font-mono text-neutral-500 mt-1 max-w-sm mx-auto">
          No organization memberships detected. Create a new team workspace or join an existing organization.
        </p>
      </div>

      {/* Main Container */}
      <div className="border border-black dark:border-white bg-white dark:bg-black p-6 sm:p-7 shadow-none">
        {/* Segmented Control / Tabs */}
        <div className="grid grid-cols-2 border border-black dark:border-white mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("create");
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
              activeTab === "create"
                ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                : "bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Create Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("join");
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors border-l border-black dark:border-white ${
              activeTab === "join"
                ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                : "bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2 border border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 p-3 text-xs font-mono text-foreground">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Create Organization */}
        {activeTab === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground">
                Organization Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                <Input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. E-Cell, Robotics Club, ACM"
                  className="pl-9"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-500">
                  Join Code (Opt)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                  <Input
                    type="text"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                    placeholder="ECELL-2026"
                    className="pl-9 font-mono"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-500">
                  Passcode (Opt)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                  <Input
                    type="text"
                    value={createSecret}
                    onChange={(e) => setCreateSecret(e.target.value)}
                    placeholder="passcode"
                    className="pl-9 font-mono"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] font-mono text-neutral-500 pt-1">
              You will enter as Leader. Codes will auto-generate if omitted.
            </p>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 mt-2"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{isPending ? "Creating Organization..." : "Create & Enter as Leader"}</span>
            </Button>
          </form>
        )}

        {/* Tab 2: Join Organization (2-Layered) */}
        {activeTab === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="text-[11px] font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-900 p-3 border border-neutral-200 dark:border-neutral-800">
              Enter both the Organization Code (Layer 1) and Passcode (Layer 2) provided by your Leader.
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground">
                Layer 1: Organization Code *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                <Input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ECELL-2026"
                  className="pl-9 font-mono"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground">
                Layer 2: Secret Passcode *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                <Input
                  type="password"
                  required
                  value={joinSecret}
                  onChange={(e) => setJoinSecret(e.target.value)}
                  placeholder="Enter secret passcode"
                  className="pl-9 font-mono"
                  disabled={isPending}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 mt-2"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{isPending ? "Verifying..." : "Verify & Join Workspace"}</span>
            </Button>
          </form>
        )}
      </div>

      {/* Footer Info & Sign Out */}
      <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-500">
        <div className="flex items-center gap-1.5 truncate max-w-[240px]">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{email}</span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isPending}
          className="text-foreground hover:underline font-semibold cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
