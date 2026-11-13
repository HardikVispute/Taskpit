"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Plus,
  ShieldCheck,
  LogIn,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  switchActiveOrgAction,
  createOrganizationAction,
  joinOrganizationAction,
} from "@/server/actions/organization.actions";
import { signOutAction } from "@/server/actions/auth.actions";
import type { UserOrganizationMembership } from "@/shared/types/auth.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
        router.push("/workspace");
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

  return (
    <div className="w-full max-w-[500px] mx-auto py-12 px-4">
      {/* Header with Brand */}
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
          Select Workspace
        </h1>
        <p className="text-xs font-mono text-neutral-500 mt-1">
          {userName} ({userEmail})
        </p>
      </div>

      {/* Grouped List: Organizations */}
      <div className="border border-black dark:border-white bg-white dark:bg-black divide-y divide-neutral-200 dark:divide-neutral-800">
        {memberships.map((membership) => {
          const isActive = membership.organizationId === activeOrgId;
          return (
            <div
              key={membership.membershipId}
              onClick={() => !isPending && handleSelectOrg(membership.organizationId)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wide truncate">
                    {membership.organizationName}
                  </span>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase text-foreground border border-black dark:border-white px-1.5 py-0.2">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>
                <div className="mt-1.5">
                  <Badge variant={membership.role === "leader" ? "default" : "secondary"}>
                    {membership.role}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  disabled={isPending}
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
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowAddOrg(!showAddOrg);
              setErrorMessage(null);
            }}
            className="w-full h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showAddOrg ? "Close" : "Create or Join Another Organization"}</span>
          </Button>
        </div>

        {showAddOrg && (
          <div className="mt-4 border border-black dark:border-white bg-white dark:bg-black p-5">
            {/* Segmented Control */}
            <div className="grid grid-cols-2 border border-black dark:border-white mb-4">
              <button
                type="button"
                onClick={() => {
                  setAddTab("create");
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                  addTab === "create"
                    ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                    : "bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
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
                className={`py-2 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors border-l border-black dark:border-white ${
                  addTab === "join"
                    ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                    : "bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
                }`}
              >
                Join with Code
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 flex items-start gap-2 border border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 p-2.5 text-xs font-mono text-foreground">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {addTab === "create" ? (
              <form onSubmit={handleCreate} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground">
                    Organization Name *
                  </label>
                  <Input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Cultural Committee"
                    disabled={isPending}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-500">
                      Join Code (Opt)
                    </label>
                    <Input
                      type="text"
                      value={createCode}
                      onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                      placeholder="CULT-2026"
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-500">
                      Passcode (Opt)
                    </label>
                    <Input
                      type="text"
                      value={createSecret}
                      onChange={(e) => setCreateSecret(e.target.value)}
                      placeholder="passcode"
                      disabled={isPending}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-9 mt-1"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{isPending ? "Creating..." : "Create Organization"}</span>
                </Button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground">
                    Layer 1: Organization Code *
                  </label>
                  <Input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ACM-2026"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-foreground">
                    Layer 2: Secret Passcode *
                  </label>
                  <Input
                    type="password"
                    required
                    value={joinSecret}
                    onChange={(e) => setJoinSecret(e.target.value)}
                    placeholder="Enter secret passcode"
                    disabled={isPending}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-9 mt-1"
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
      <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-500">
        <span>Identity: {userEmail}</span>
        <button
          onClick={() => startTransition(async () => await signOutAction())}
          className="text-foreground hover:underline font-semibold cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
