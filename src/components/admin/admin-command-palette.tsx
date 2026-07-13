"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { adminNavFlat } from "@/constants/admin";
import { cn } from "@/lib/utils";

/**
 * ⌘K command palette scoped to admin navigation. Fuzzy-filters the flattened
 * nav and routes on selection. Super-admin-only destinations are hidden for
 * plain admins via the `isSuperAdmin` prop.
 */
export function AdminCommandPalette({
  open,
  onOpenChange,
  isSuperAdmin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);

  const items = React.useMemo(() => {
    const base = adminNavFlat.filter((l) => !l.superAdminOnly || isSuperAdmin);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((l) => l.label.toLowerCase().includes(q) || l.href.toLowerCase().includes(q));
  }, [query, isSuperAdmin]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  React.useEffect(() => setActive(0), [query]);

  const go = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      go(items[active].href);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a module..."
            className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No matches.</li>}
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    i === active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate text-foreground">{item.label}</span>
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5 opacity-50" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Dialog>
  );
}
