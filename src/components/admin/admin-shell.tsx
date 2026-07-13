"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import type { SessionUser } from "@/types/user";

const COLLAPSE_KEY = "bv:admin-sidebar-collapsed";

/**
 * Client chrome for the Super Admin console. Owns collapsible sidebar, mobile
 * drawer, ⌘K command palette, the right-hand live activity rail, and provides
 * TanStack Query + toasts + confirm dialogs to every admin route.
 */
export function AdminShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  // The admin console is light-only. Force light while mounted; the main
  // portal's theme toggle re-applies the user's preference when they leave.
  React.useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  React.useEffect(() => setMobileOpen(false), [pathname]);

  // Prevent body scroll when the mobile drawer is open.
  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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

  return (
    <QueryProvider>
      <ConfirmProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Mobile scrim */}
          {mobileOpen && (
            <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
          )}

          <AdminSidebar
            isSuperAdmin={isSuperAdmin}
            collapsed={collapsed}
            mobileOpen={mobileOpen}
            onNavigate={() => setMobileOpen(false)}
            onToggleCollapse={toggleCollapse}
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <AdminTopbar
              user={user}
              onOpenMobile={() => setMobileOpen(true)}
              onToggleSidebar={toggleCollapse}
              onOpenSearch={() => setSearchOpen(true)}
            />
            <main className="admin-scroll flex-1 min-h-0 overflow-y-auto p-4 sm:p-6" style={{ overscrollBehavior: 'contain' }}>
              <div className="mx-auto w-full max-w-[1600px]">{children}</div>
            </main>
          </div>
        </div>

        <AdminCommandPalette open={searchOpen} onOpenChange={setSearchOpen} isSuperAdmin={isSuperAdmin} />
        <Toaster position="top-right" richColors />
      </ConfirmProvider>
    </QueryProvider>
  );
}
