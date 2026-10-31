"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Users,
  Heart,
  ChevronDown,
  Building2,
  LogOut,
  Layers,
  KeyRound,
  Check,
} from "lucide-react";
import { switchActiveOrgAction, signOutAction } from "@/app/actions/auth";
import { MembershipRole } from "@/lib/types/auth";
import { UserOrganizationMembership } from "@/lib/services/user-service";

interface WorkspaceHeaderProps {
  organizationName: string;
  currentOrgId: string;
  currentRole: MembershipRole;
  currentDisplayName: string;
  currentEmail?: string;
  availableMemberships?: UserOrganizationMembership[];
  joinCode?: string | null;
  joinSecret?: string | null;
}

export function WorkspaceHeader({
  organizationName,
  currentOrgId,
  currentRole,
  currentDisplayName,
  currentEmail,
  availableMemberships = [],
  joinCode,
  joinSecret,
}: WorkspaceHeaderProps) {
  const [isPending, startTransition] = useTransition();
  const [isOrgMenuOpen, setIsOrgMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const orgMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target as Node)) {
        setIsOrgMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOrgSwitch = (orgId: string) => {
    if (orgId === currentOrgId || isPending) return;
    setIsOrgMenuOpen(false);
    startTransition(async () => {
      await switchActiveOrgAction(orgId);
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  const getRoleIcon = (role: MembershipRole) => {
    switch (role) {
      case "leader":
        return <Shield className="h-3 w-3 text-primary" />;
      case "volunteer":
        return <Heart className="h-3 w-3 text-rose-500" />;
      case "member":
      default:
        return <Users className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Left: Brand and Organization Switcher */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center transition-opacity hover:opacity-85">
            <Image
              src="/assets/brand/logo.svg"
              alt="TaskPit"
              width={28}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>

          <span className="text-border text-sm select-none">/</span>

          {/* Organization Switcher Dropdown */}
          <div className="relative" ref={orgMenuRef}>
            <button
              onClick={() => setIsOrgMenuOpen(!isOrgMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-muted/60 transition-colors"
            >
              <span className="text-sm font-semibold text-foreground tracking-tight">
                {organizationName}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 ${
                  isOrgMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOrgMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-border bg-card p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  Workspaces
                </div>

                <div className="space-y-0.5 mt-0.5">
                  {availableMemberships.map((membership) => {
                    const isSelected = membership.organizationId === currentOrgId;
                    return (
                      <button
                        key={membership.membershipId}
                        onClick={() => handleOrgSwitch(membership.organizationId)}
                        disabled={isPending}
                        className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors text-left ${
                          isSelected
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <span className="truncate max-w-[140px]">{membership.organizationName}</span>
                        <div className="flex items-center gap-1">
                          <span className="capitalize text-[10px] text-muted-foreground">
                            {membership.role}
                          </span>
                          {isSelected && <Check className="h-3 w-3 text-primary ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-1.5 border-t border-border pt-1">
                  {currentRole === "leader" && joinCode && (
                    <div className="mx-1 my-1.5 rounded-lg border border-border/80 bg-muted/40 p-2.5 text-xs">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-foreground mb-1">
                        <KeyRound className="h-3 w-3 text-primary" />
                        <span>Team Join Credentials</span>
                      </div>
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Org Code:</span>
                          <span className="font-semibold text-foreground select-all bg-card px-1 py-0.5 rounded border border-border/60">
                            {joinCode}
                          </span>
                        </div>
                        {joinSecret && (
                          <div className="flex justify-between items-center text-muted-foreground">
                            <span>Secret Passcode:</span>
                            <span className="font-semibold text-foreground select-all bg-card px-1 py-0.5 rounded border border-border/60">
                              {joinSecret}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Link
                    href="/select-org"
                    onClick={() => setIsOrgMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Manage all organizations</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Role Pill and Profile Menu */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
            {getRoleIcon(currentRole)}
            <span>{currentRole}</span>
          </span>

          {/* User Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 rounded-full p-1 hover:bg-muted transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                {currentDisplayName.charAt(0).toUpperCase()}
              </div>
              <ChevronDown
                className={`h-3 w-3 text-muted-foreground transition-transform duration-150 ${
                  isProfileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-2.5 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-foreground truncate">{currentDisplayName}</p>
                  {currentEmail && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{currentEmail}</p>
                  )}
                </div>

                <div className="py-1">
                  <Link
                    href="/select-org"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Switch Workspace</span>
                  </Link>
                </div>

                <div className="border-t border-border pt-1">
                  <button
                    onClick={handleSignOut}
                    disabled={isPending}
                    className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
