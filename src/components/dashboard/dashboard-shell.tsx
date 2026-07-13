"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { AssistantWidget } from "@/components/dashboard/assistant-widget";
import type { SessionUser } from "@/types/user";

const STORAGE_KEY = "bv:sidebar-collapsed";

/**
 * Client shell for the authenticated app. Owns:
 * - desktop sidebar collapse state (persisted to localStorage),
 * - the mobile off-canvas drawer,
 * - the global command palette (⌘K / Ctrl-K),
 * and provides TanStack Query + toast context to every dashboard route.
 */
export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Restore persisted collapse preference after mount (avoids hydration diff).
  React.useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Global ⌘K / Ctrl-K to open search; Esc handled inside the palette.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent body scroll when the mobile drawer is open.
  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <QueryProvider>
      <ConfirmProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}

        <DashboardSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onNavigate={() => setMobileOpen(false)}
          onToggleCollapse={toggleCollapse}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DashboardTopbar
            user={user}
            onToggleSidebar={toggleCollapse}
            onOpenMobile={() => setMobileOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
          />
          <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">{children}</main>
        </div>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AssistantWidget />
      <Toaster position="top-right" richColors closeButton theme="system" />
      </ConfirmProvider>
    </QueryProvider>
  );
}
