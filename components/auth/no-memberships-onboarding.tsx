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
  Sparkles,
  Building2,
} from "lucide-react";
import {
  createOrganizationAction,
  joinOrganizationAction,
  signOutAction,
} from "@/app/actions/auth";
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
        router.push("/");
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
        router.push("/");
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
    <div className="w-full max-w-md mx-auto py-12 px-4 sm:px-6">
      {/* Brand & Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-3.5 transition-opacity hover:opacity-85">
          <Image
            src="/assets/brand/logo.svg"
            alt="TaskPit"
            width={36}
            height={36}
            className="h-9 w-auto mx-auto"
            priority
          />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome to TaskPit, {displayName}
        </h1>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
          You are not currently in any organization. Create a new workspace as Leader or join an existing team using credentials.
        </p>
      </div>

      {/* Main Container */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Segmented Control */}
        <div className="flex rounded-lg bg-muted p-1 border border-border/60 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("create");
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "create"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "join"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Create Organization */}
        {activeTab === "create" && (
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Organization Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
                <Input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. E-Cell, Robotics Club, ACM"
                  className="pl-8 h-9 text-xs"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Custom Code (Optional)
                </label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
                  <Input
                    type="text"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                    placeholder="ECELL-2026"
                    className="pl-8 h-9 text-xs font-mono"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Passcode (Optional)
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
                  <Input
                    type="text"
                    value={createSecret}
                    onChange={(e) => setCreateSecret(e.target.value)}
                    placeholder="passcode"
                    className="pl-8 h-9 text-xs font-mono"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-1">
              <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
              <span>
                You will be the <strong className="text-foreground">Leader</strong>. A join code and passcode will be generated if left empty.
              </span>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-9 text-xs font-medium gap-1.5 mt-2"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{isPending ? "Creating Organization..." : "Create & Enter as Leader"}</span>
            </Button>
          </form>
        )}

        {/* Tab 2: Join Organization (2-Layered) */}
        {activeTab === "join" && (
          <form onSubmit={handleJoin} className="space-y-3.5">
            <div className="text-[11px] text-muted-foreground bg-muted/60 p-2.5 rounded-lg border border-border/60">
              Enter both the Organization Code and Secret Passcode shared by your leader.
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Layer 1: Organization Code <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
                <Input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ECELL-2026"
                  className="pl-8 h-9 text-xs font-mono"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Layer 2: Secret Passcode <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
                <Input
                  type="password"
                  required
                  value={joinSecret}
                  onChange={(e) => setJoinSecret(e.target.value)}
                  placeholder="Enter secret passcode"
                  className="pl-8 h-9 text-xs font-mono"
                  disabled={isPending}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-9 text-xs font-medium gap-1.5 mt-2"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{isPending ? "Verifying Credentials..." : "Verify & Join Workspace"}</span>
            </Button>
          </form>
        )}
      </div>

      {/* Footer Info & Sign Out */}
      <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 truncate max-w-[240px]">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{email}</span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
