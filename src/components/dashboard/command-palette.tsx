"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  FileText,
  CornerDownLeft,
  Loader2,
  ArrowUp,
  ArrowDown,
  type LucideIcon,
} from "lucide-react";
import { apiGet } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { dashboardNav } from "@/constants/dashboard";

interface DocHit {
  id: string;
  title: string;
  status: string;
  court: string | null;
  caseNumber: string | null;
}

interface Command {
  id: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  href: string;
  group: "Pages" | "Documents";
}

const navCommands: Command[] = dashboardNav.flatMap((g) =>
  g.links.map((l) => ({
    id: `nav:${l.href}`,
    label: l.label,
    icon: l.icon,
    href: l.href,
    group: "Pages" as const,
  }))
);

/**
 * Global command palette (⌘K / Ctrl-K). Fuzzy-filters dashboard pages and the
 * user's documents, with full keyboard navigation. Documents are fetched live
 * from `/api/documents` the first time the palette opens.
 */
export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const [isFreePlan, setIsFreePlan] = React.useState(false);

  const { data: docs, isFetching } = useQuery({
    queryKey: ["command-palette", "documents"],
    queryFn: async () => {
      const res = await apiGet<DocHit[]>("/api/documents?take=100");
      return res.data;
    },
    enabled: open,
    staleTime: 60_000,
  });

  // Focus input, reset state, and check subscription plan when palette opens.
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());

      fetch("/api/subscription/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.success && json?.data?.plan?.key === "FREE") {
            setIsFreePlan(true);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  const q = query.trim().toLowerCase();

  const results = React.useMemo<Command[]>(() => {
    const docCommands: Command[] = (docs ?? []).map((d) => ({
      id: `doc:${d.id}`,
      label: d.title,
      sublabel: d.caseNumber ?? d.court ?? d.status,
      icon: FileText,
      href: `/dashboard/documents/${d.id}`,
      group: "Documents" as const,
    }));

    const availableNavCommands = isFreePlan
      ? navCommands.filter((c) => c.href !== "/dashboard/compare")
      : navCommands;

    const all = [...availableNavCommands, ...docCommands];
    if (!q) return all.slice(0, 8).concat(docCommands.slice(0, 6));
    const filtered = all.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.sublabel?.toLowerCase().includes(q)
    );
    return filtered.slice(0, 20);
  }, [docs, q, isFreePlan]);

  // Keep the active index in range as results change.
  React.useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)));
  }, [results.length]);

  const go = React.useCallback(
    (cmd?: Command) => {
      const target = cmd ?? results[active];
      if (!target) return;
      onClose();
      router.push(target.href);
    },
    [results, active, onClose, router]
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  // Scroll the active row into view.
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  let renderIndex = -1;
  let lastGroup: string | null = null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search documents and pages..."
            className="h-12 w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          {isFetching && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">
              No matches for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.map((cmd) => {
              renderIndex += 1;
              const idx = renderIndex;
              const Icon = cmd.icon;
              const showHeader = cmd.group !== lastGroup;
              lastGroup = cmd.group;
              return (
                <React.Fragment key={cmd.id}>
                  {showHeader && (
                    <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {cmd.group}
                    </p>
                  )}
                  <button
                    data-idx={idx}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(cmd)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                      idx === active ? "bg-violet-500/10" : "hover:bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        idx === active
                          ? "bg-violet-500/20 text-violet-500"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {cmd.label}
                      </span>
                      {cmd.sublabel && (
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {cmd.sublabel}
                        </span>
                      )}
                    </span>
                    {idx === active && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            <ArrowDown className="h-3 w-3" /> navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" /> open
          </span>
        </div>
      </div>
    </div>
  );
}
