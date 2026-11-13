"use client";

import Link from "next/link";
import {
  Bell,
  Search,
  Plus,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AppHeaderProps {
  pageTitle?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function AppHeader({
  pageTitle = "Home",
  onToggleSidebar,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-border bg-background px-4">
      {/* Left: Mobile/Desktop Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="flex h-7 w-7 items-center justify-center border border-transparent hover:border-black dark:hover:border-white text-foreground transition-colors cursor-pointer"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-neutral-500 uppercase hidden sm:inline">Workspace</span>
          <span className="text-neutral-400 hidden sm:inline">/</span>
          <span className="font-bold text-foreground uppercase tracking-wider">{pageTitle}</span>
        </div>
      </div>

      {/* Right: Quick actions & shortcuts */}
      <div className="flex items-center gap-2">
        {/* Quick Search Shortcut */}
        <div className="hidden md:flex items-center gap-2 border border-border bg-card px-2.5 py-1 text-xs font-mono text-neutral-500">
          <Search className="h-3 w-3 text-foreground" />
          <span>Search</span>
          <kbd className="border border-border px-1 text-[9px] font-mono text-foreground">
            Ctrl K
          </kbd>
        </div>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-7 w-7 items-center justify-center border border-transparent hover:border-black dark:hover:border-white text-foreground transition-colors cursor-pointer"
        >
          <Bell className="h-3.5 w-3.5" />
        </button>

        {/* Theme Mode Toggle (Light / Dark) */}
        <ThemeToggle className="h-7 w-7" />

        {/* New Action Button */}
        <Link href="/select-org">
          <Button
            size="sm"
            variant="default"
            className="h-7 text-[11px]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Task</span>
            <kbd className="hidden sm:inline border border-neutral-700 dark:border-neutral-300 px-1 text-[8px] text-neutral-300 dark:text-neutral-700">
              N
            </kbd>
          </Button>
        </Link>
      </div>
    </header>
  );
}

