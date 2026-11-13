"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const nextDark = !isDark;
    if (nextDark) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("taskpit-theme", "dark");
      } catch {
        // ignore
      }
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("taskpit-theme", "light");
      } catch {
        // ignore
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`group flex items-center justify-center gap-2 border border-border bg-background px-2.5 py-1 text-xs font-mono uppercase tracking-wider text-foreground hover:border-foreground transition-colors cursor-pointer ${
        showLabel ? "h-8" : "h-8 w-8 px-0"
      } ${className}`}
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 text-foreground transition-transform group-hover:rotate-45" />
      ) : (
        <Moon className="h-3.5 w-3.5 text-foreground transition-transform group-hover:-rotate-12" />
      )}
      {showLabel && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
