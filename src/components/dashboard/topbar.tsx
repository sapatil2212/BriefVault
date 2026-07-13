"use client";

import { Search, PanelLeft, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NotificationsMenu } from "@/components/dashboard/notifications-menu";
import { UserMenu } from "@/components/dashboard/user-menu";
import type { SessionUser } from "@/types/user";

/**
 * Sticky top bar: sidebar controls (mobile hamburger + desktop collapse),
 * personalized greeting, a command-palette search trigger, theme toggle, live
 * notifications, and the user menu.
 */
export function DashboardTopbar({
  user,
  onToggleSidebar,
  onOpenMobile,
  onOpenSearch,
}: {
  user: SessionUser;
  onToggleSidebar?: () => void;
  onOpenMobile?: () => void;
  onOpenSearch?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-5">
      {/* Left: sidebar controls + greeting */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile: open drawer */}
        <button
          onClick={onOpenMobile}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted lg:hidden"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
        {/* Desktop: collapse rail */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted lg:flex"
        >
          <PanelLeft className="h-[18px] w-[18px]" />
        </button>

        <div className="min-w-0">
          <h1 className="flex items-center gap-1.5 truncate text-[15px] font-bold text-foreground">
            Welcome back, {user.firstName}! <span aria-hidden>👋</span>
          </h1>
          <p className="hidden truncate text-[12px] text-muted-foreground sm:block">
            Smart legal insights. Simplified for you.
          </p>
        </div>
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Desktop: full search trigger */}
        <button
          onClick={onOpenSearch}
          className="group hidden h-9 w-56 items-center gap-2 rounded-lg border border-border bg-muted px-3 text-left text-[13px] text-muted-foreground transition hover:border-violet-400/60 hover:bg-card md:flex xl:w-72"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">Search documents, cases...</span>
          <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
        {/* Mobile/tablet: icon-only search */}
        <button
          onClick={onOpenSearch}
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted md:hidden"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <ThemeToggle />
        <NotificationsMenu />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
