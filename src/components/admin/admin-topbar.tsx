"use client";

import Link from "next/link";
import { Search, Menu, PanelLeft, ExternalLink } from "lucide-react";
import { UserMenu } from "@/components/dashboard/user-menu";
import { StatusPill } from "@/components/admin/status-pill";
import type { SessionUser } from "@/types/user";

/**
 * Admin top navigation: sidebar controls, a global command-palette trigger,
 * a link back to the user app, theme toggle, activity-rail toggle, role pill,
 * and the shared user menu.
 */
export function AdminTopbar({
  user,
  onOpenMobile,
  onToggleSidebar,
  onOpenSearch,
}: {
  user: SessionUser;
  onOpenMobile?: () => void;
  onToggleSidebar?: () => void;
  onOpenSearch?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenMobile}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted lg:hidden"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted lg:flex"
        >
          <PanelLeft className="h-[18px] w-[18px]" />
        </button>

        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <span className="text-[15px] font-bold text-foreground">Operations Center</span>
          {user.role && <StatusPill value={user.role} />}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          onClick={onOpenSearch}
          className="group hidden h-9 w-56 items-center gap-2 rounded-lg border border-border bg-muted px-3 text-left text-[13px] text-muted-foreground transition hover:border-violet-400/60 hover:bg-card md:flex xl:w-72"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">Search modules, jump to...</span>
          <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
        </button>
        <button
          onClick={onOpenSearch}
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted md:hidden"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <Link
          href="/dashboard"
          title="Back to app"
          className="hidden h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground transition hover:bg-muted sm:flex"
        >
          <ExternalLink className="h-3.5 w-3.5" /> App
        </Link>

        <UserMenu user={user} />
      </div>
    </header>
  );
}
