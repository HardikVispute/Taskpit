"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar, OrganizationMembershipItem } from "./app-sidebar";
import { AppHeader } from "./app-header";

interface AppShellProps {
  currentDisplayName: string;
  currentEmail: string;
  currentOrgId: string;
  currentOrgName: string;
  currentRole: string;
  availableMemberships: OrganizationMembershipItem[];
  children: React.ReactNode;
}

export function AppShell({
  currentDisplayName,
  currentEmail,
  currentOrgId,
  currentOrgName,
  currentRole,
  availableMemberships,
  children,
}: AppShellProps) {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Global hotkeys
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        // focus search or redirect
        router.push("/select-org");
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        router.push("/select-org");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="relative min-h-screen w-full flex bg-background text-foreground">
      {/* Left Navigation Sidebar */}
      <AppSidebar
        currentDisplayName={currentDisplayName}
        currentEmail={currentEmail}
        currentOrgId={currentOrgId}
        currentOrgName={currentOrgName}
        currentRole={currentRole}
        availableMemberships={availableMemberships}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full h-screen overflow-y-auto">
        {/* Top Navigation Bar */}
        <AppHeader
          pageTitle="Workspace"
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setIsMobileOpen(true);
            } else {
              setIsCollapsed((prev) => !prev);
            }
          }}
          isSidebarOpen={isMobileOpen}
        />

        {/* Page Content */}
        <main className="flex-1 flex flex-col min-h-0 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
