"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  CheckSquare,
  Users,
  Send,
  Bell,
  Clock,
  Building2,
  Plus,
  Settings,
  BookOpen,
  HelpCircle,
  Info,
  LogOut,
  User,
  ChevronsUpDown,
  Check,
  PanelLeftClose,
  PanelLeft,
  X,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { signOutAction } from "@/server/actions/auth.actions";
import { switchActiveOrgAction } from "@/server/actions/organization.actions";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export interface OrganizationMembershipItem {
  id: string;
  organizationId: string;
  organizationName: string;
  role: string;
}

interface AppSidebarProps {
  currentDisplayName?: string;
  currentEmail?: string;
  currentOrgId?: string;
  currentOrgName?: string;
  currentRole?: string;
  availableMemberships?: OrganizationMembershipItem[];
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  hotkey?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export function AppSidebar({
  currentDisplayName = "User",
  currentEmail = "",
  currentOrgId = "",
  currentOrgName = "Select Workspace",
  currentRole = "member",
  availableMemberships = [],
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [isPendingOrg, startTransition] = useTransition();
  const orgMenuRef = useRef<HTMLDivElement>(null);

  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // Close org dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target as Node)) {
        setOrgDropdownOpen(false);
      }
    }
    if (orgDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [orgDropdownOpen]);

  // Global hotkey navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "1") {
        router.push("/");
      } else if (e.key === "o" || e.key === "O") {
        router.push("/select-org");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handleSelectOrg = (orgId: string) => {
    setOrgDropdownOpen(false);
    if (orgId === currentOrgId) return;

    startTransition(async () => {
      const res = await switchActiveOrgAction(orgId);
      if (res.success) {
        router.refresh();
      }
    });
  };

  const navGroups: NavGroup[] = [
    {
      group: "Overview",
      items: [{ label: "Home", href: "/", icon: Home, exact: true, hotkey: "1" }],
    },
    {
      group: "Work",
      items: [
        { label: "My Tasks", href: "#my-tasks", icon: CheckSquare, hotkey: "2" },
        { label: "Team Tasks", href: "#team-tasks", icon: Users, hotkey: "3" },
        { label: "Delegated by Me", href: "#delegated", icon: Send, hotkey: "4" },
      ],
    },
    {
      group: "Personal",
      items: [
        { label: "Notifications", href: "#notifications", icon: Bell },
        { label: "Reminders", href: "#reminders", icon: Clock },
      ],
    },
    {
      group: "Organizations",
      items: [
        { label: "All Organizations", href: "/select-org", icon: Building2, hotkey: "O" },
        { label: "Create Workspace", href: "/select-org?action=create", icon: Plus },
      ],
    },
    {
      group: "Preferences",
      items: [{ label: "Settings", href: "#settings", icon: Settings, hotkey: "S" }],
    },
    {
      group: "Resources",
      items: [
        { label: "How to Use", href: "#how-to-use", icon: BookOpen },
        { label: "Help & Support", href: "#help", icon: HelpCircle },
        { label: "About TaskPit", href: "#about", icon: Info },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex h-full w-full flex-col justify-between overflow-hidden bg-background text-foreground">
      {/* 1. Header: Brand & Workspace Switcher */}
      <div className={cn("shrink-0 border-b border-border", isCollapsed ? "p-2 flex flex-col items-center gap-2" : "p-4")}>
        <div className={cn("flex items-center w-full", isCollapsed ? "flex-col gap-2" : "justify-between gap-2 mb-3")}>
          <Link
            href="/"
            className={cn("flex items-center group", isCollapsed ? "justify-center" : "gap-2.5")}
            title="TaskPit Home"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black">
              <Image
                src="/assets/brand/logo.svg"
                alt="TaskPit"
                width={20}
                height={20}
                className="h-5 w-auto brightness-0 invert dark:invert-0"
                priority
              />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                TaskPit
              </span>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex h-7 w-7 shrink-0 items-center justify-center border border-transparent hover:border-black dark:hover:border-white text-foreground transition-colors cursor-pointer"
          >
            {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="md:hidden flex h-7 w-7 shrink-0 items-center justify-center border border-transparent hover:border-black dark:hover:border-white text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Organization Switcher Dropdown */}
        {!isCollapsed && (
          <div className="relative" ref={orgMenuRef}>
            <button
              type="button"
              onClick={() => setOrgDropdownOpen((prev) => !prev)}
              disabled={isPendingOrg}
              aria-expanded={orgDropdownOpen}
              className="flex w-full items-center justify-between border border-border bg-card hover:bg-neutral-100 dark:hover:bg-neutral-900 px-2.5 py-2 text-left transition-colors cursor-pointer"
            >
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-xs font-mono font-bold text-foreground truncate uppercase">
                  {currentOrgName}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">
                  Role: {currentRole}
                </span>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
            </button>

            {/* Switcher Menu */}
            {orgDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-full z-50 border border-black dark:border-white bg-white dark:bg-black p-1 shadow-none">
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  Select Workspace
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {availableMemberships.map((m) => {
                    const isSelected = m.organizationId === currentOrgId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectOrg(m.organizationId)}
                        className={cn(
                          "flex w-full items-center justify-between px-2 py-1.5 text-xs font-mono text-left transition-colors cursor-pointer",
                          isSelected
                            ? "bg-black text-white dark:bg-white dark:text-black font-bold"
                            : "text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        )}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate uppercase">{m.organizationName}</span>
                          <span className={cn("text-[10px]", isSelected ? "text-neutral-300 dark:text-neutral-700" : "text-neutral-500")}>
                            {m.role}
                          </span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-1 pt-1 border-t border-border">
                  <Link
                    href="/select-org?action=create"
                    onClick={() => setOrgDropdownOpen(false)}
                    className="flex w-full items-center gap-1.5 px-2 py-1.5 text-xs font-mono text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors uppercase font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Workspace</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
                {group.group}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || (item.href !== "#" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => onCloseMobile?.()}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center justify-between py-1.5 px-2 text-xs font-mono transition-colors cursor-pointer border border-transparent",
                      isCollapsed && "justify-center px-0",
                      isActive
                        ? "bg-black text-white dark:bg-white dark:text-black font-semibold border-black dark:border-white"
                        : "text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <IconComponent className="h-3.5 w-3.5 shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.hotkey && (
                      <kbd className={cn(
                        "text-[9px] font-mono px-1 border",
                        isActive
                          ? "border-neutral-700 text-neutral-300 dark:border-neutral-300 dark:text-neutral-700"
                          : "border-border text-neutral-400"
                      )}>
                        {item.hotkey}
                      </kbd>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 3. Footer: User Profile & Actions */}
      <div className="shrink-0 p-3 border-t border-border space-y-2">
        {/* User Card */}
        <div
          className={cn(
            "flex items-center gap-2 p-2 border border-border bg-card",
            isCollapsed && "justify-center p-1"
          )}
          title={isCollapsed ? currentDisplayName : undefined}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-mono font-bold text-xs">
            {currentDisplayName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-mono font-bold text-foreground truncate">
                {currentDisplayName}
              </span>
              <span className="text-[10px] font-mono text-neutral-500 truncate">
                {currentEmail || currentRole}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={cn("flex items-center gap-1", isCollapsed ? "flex-col" : "justify-between")}>
          <Link
            href="/select-org"
            title="Account Workspaces"
            className={cn(
              "flex items-center gap-1.5 p-1.5 text-xs font-mono text-neutral-500 hover:text-foreground transition-colors cursor-pointer",
              isCollapsed && "justify-center w-full"
            )}
          >
            <User className="h-3.5 w-3.5" />
            {!isCollapsed && <span>Profile</span>}
          </Link>

          <ThemeToggle className="h-6 w-6" />

          <form action={signOutAction} className={isCollapsed ? "w-full" : ""}>
            <button
              type="submit"
              title="Sign Out"
              className={cn(
                "flex items-center gap-1.5 p-1.5 text-xs font-mono text-neutral-500 hover:text-foreground transition-colors cursor-pointer",
                isCollapsed && "justify-center w-full"
              )}
            >
              <LogOut className="h-3.5 w-3.5" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: 240px default */}
      <aside
        className={cn(
          "hidden md:flex h-screen flex-col shrink-0 border-r border-border bg-background transition-[width] duration-150 select-none z-20",
          isCollapsed ? "w-[56px]" : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-[260px] max-w-[85vw] h-full bg-background border-r border-border z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
