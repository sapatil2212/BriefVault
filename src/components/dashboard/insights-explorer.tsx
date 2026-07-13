"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import {
  analysisCatalog,
  groupLabels,
  type AnalysisGroup,
} from "@/lib/ai/analysis/catalog";

export interface ExtractedInsight {
  documentId: string;
  documentTitle: string;
  kind: string;
  confidence: number;
  itemCount: number;
  updatedAt: string;
}

const kindMeta = new Map(analysisCatalog.map((c) => [c.kind, c]));
const GROUP_ORDER: AnalysisGroup[] = ["summary", "litigation", "references", "compliance"];

const groupTone: Record<AnalysisGroup, string> = {
  summary: "bg-violet-500/10 text-violet-500",
  litigation: "bg-blue-500/10 text-blue-500",
  references: "bg-emerald-500/10 text-emerald-500",
  compliance: "bg-amber-500/10 text-amber-500",
};

/** Filterable view of every AI insight extracted across the user's documents. */
export function InsightsExplorer({ insights }: { insights: ExtractedInsight[] }) {
  const [group, setGroup] = React.useState<AnalysisGroup | "all">("all");

  const available = React.useMemo(() => {
    const groups = new Set<AnalysisGroup>();
    for (const i of insights) {
      const g = kindMeta.get(i.kind)?.group;
      if (g) groups.add(g);
    }
    return GROUP_ORDER.filter((g) => groups.has(g));
  }, [insights]);

  const filtered = React.useMemo(() => {
    if (group === "all") return insights;
    return insights.filter((i) => kindMeta.get(i.kind)?.group === group);
  }, [insights, group]);

  if (insights.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="No insights yet"
        description="Open a processed document and run any analysis (highlights, risks, citations, deadlines…) to collect its insights here."
        action={
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110"
          >
            Browse Documents
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Group filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={group === "all"} onClick={() => setGroup("all")}>
          All ({insights.length})
        </FilterChip>
        {available.map((g) => (
          <FilterChip key={g} active={group === g} onClick={() => setGroup(g)}>
            {groupLabels[g]}
          </FilterChip>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((insight, i) => {
          const meta = kindMeta.get(insight.kind);
          const g = meta?.group ?? "summary";
          return (
            <Link
              key={`${insight.documentId}-${insight.kind}-${i}`}
              href={`/dashboard/documents/${insight.documentId}`}
              className="group rounded-xl border border-border bg-card p-4 transition hover:border-violet-500/40 hover:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", groupTone[g])}>
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-[13px] font-semibold text-foreground">
                  {meta?.label ?? insight.kind}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-violet-500" />
              </div>
              {meta?.description && (
                <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                  {meta.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                <span className="truncate font-medium text-foreground/80">
                  {insight.documentTitle}
                </span>
                <span className="ml-auto shrink-0">
                  {insight.itemCount} item{insight.itemCount === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Updated {timeAgo(insight.updatedAt)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-[12px] font-medium transition",
        active
          ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
          : "border-border bg-card text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
