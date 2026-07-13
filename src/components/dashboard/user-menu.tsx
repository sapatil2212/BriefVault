"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, User, Settings, LogOut, Loader2 } from "lucide-react";
import type { SessionUser } from "@/types/user";

/** User chip + dropdown with profile, settings, and logout. */
export function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U";

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
      router.push("/signin");
      router.refresh();
    } catch {
      toast.error("Failed to sign out. Please try again.");
      setLoggingOut(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card py-1 pl-1 pr-2.5 transition hover:bg-muted"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-600 text-[13px] font-semibold text-white">
          {initials}
        </span>
        <span className="hidden flex-col text-left leading-tight sm:flex">
          <span className="max-w-[140px] truncate text-[13px] font-semibold text-foreground">
            {fullName}
          </span>
          <span className="max-w-[140px] truncate text-[10px] text-muted-foreground">
            {user.organization}
          </span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/10">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-[13px] font-semibold text-foreground">{fullName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          </div>
          <nav className="p-1.5">
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-foreground transition hover:bg-muted"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Profile
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-foreground transition hover:bg-muted"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings
            </Link>
          </nav>
          <div className="border-t border-border p-1.5">
            <button
              onClick={logout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
