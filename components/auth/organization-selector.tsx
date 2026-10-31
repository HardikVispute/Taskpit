"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Heart,
  ArrowRight,
  Plus,
  ShieldCheck,
  LogIn,
  AlertCircle,
  Sparkles,
  Check,
  Hash,
  Lock,
} from "lucide-react";
import {
  switchActiveOrgAction,
  signOutAction,
  createOrganizationAction,
  joinOrganizationAction,
} from "@/app/actions/auth";
import { UserOrganizationMembership } from "@/lib/services/user-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OrganizationSelectorProps {
  memberships: UserOrganizationMembership[];
  activeOrgId?: string;
  userName: string;
  userEmail: string;
}

export function OrganizationSelector({
  memberships,
  activeOrgId,
  userName,
  userEmail,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [addTab, setAddTab] = useState<"create" | "join">("create");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createSecret, setCreateSecret] = useState("");

  const [joinCode, setJoinCode] = useState("");
  const [joinSecret, setJoinSecret] = useState("");

  const handleSelectOrg = (organizationId: string) => {
    startTransition(async () => {
      const res = await switchActiveOrgAction(organizationId);
      if (res.success) {
        router.push("/");
        router.refresh();
      }
    });
  };

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "leader":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            <Shield className="h-3 w-3" />
            Leader
          </span>
        );
      case "volunteer":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <Heart className="h-3 w-3" />
            Volunteer
          </span>
        );
      case "member":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Users className="h-3 w-3" />
            Member
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-12 px-4 sm:px-6">
      {/* Header with Brand */}
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
          Select Workspace
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Signed in as <span className="font-medium text-foreground">{userName}</span> ({userEmail})
        </p>
      </div>

      {/* Grouped List: Organizations */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {memberships.map((membership) => {
          const isActive = membership.organizationId === activeOrgId;
          return (
            <div
              key={membership.membershipId}
              onClick={() => !isPending && handleSelectOrg(membership.organizationId)}
              className="group flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {membership.organizationName}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[11px] text-primary font-medium">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  {getRoleBadge(membership.role)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  disabled={isPending}
                  className="h-8 px-3 text-xs gap-1"
                >
                  <span>Enter</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Organization Accordion / Toggle */}
      <div className="mt-6">
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setShowAddOrg(!showAddOrg);
              setErrorMessage(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showAddOrg ? "Cancel" : "Create or join another organization"}</span>
          </button>
        </div>

        {showAddOrg && (
          <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-in fade-in-50 duration-200">
            {/* Segmented Control */}
            <div className="flex rounded-lg bg-muted p-1 border border-border/60 mb-4">
              <button
                type="button"
                onClick={() => {
                  setAddTab("create");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  addTab === "create"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Workspace
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddTab("join");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  addTab === "join"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Join with Code
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {addTab === "create" ? (
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Organization Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Cultural Committee"
                    className="h-9 text-xs"
                    disabled={isPending}
                  />
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
                        placeholder="CULT-2026"
                        className="pl-8 h-9 text-xs font-mono"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Secret Passcode (Optional)
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

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span>You will enter as Organization Leader.</span>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="w-full h-9 text-xs gap-1.5 mt-1"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{isPending ? "Creating..." : "Create Organization"}</span>
                </Button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-3">
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
                      placeholder="e.g. ACM-2026"
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
                  size="sm"
                  disabled={isPending}
                  className="w-full h-9 text-xs gap-1.5 mt-1"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>{isPending ? "Verifying..." : "Join Workspace"}</span>
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Sign Out Action */}
      <div className="mt-10 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>One account across all organizations</span>
        <button
          onClick={() => startTransition(async () => await signOutAction())}
          className="text-muted-foreground hover:text-destructive font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
