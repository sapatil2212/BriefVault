"use client";

import Link from "next/link";
import { Sparkles, Bot, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

/** AI panel surfacing live cross-document intelligence for the current user. */
export function AiInsightsLive() {
  const { data, isLoading, isError } = useDashboardStats();
  const insights = data?.insights;

  return (
    <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-4">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-violet-500">
        <Sparkles className="h-3.5 w-3.5" />
        AI Insights
      </div>

      <div className="mt-2.5 flex items-start gap-3">
        {isLoading ? (
          <div className="max-w-[72%] flex-1 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
        ) : isError || !insights ? (
          <p className="max-w-[72%] text-[13px] leading-relaxed text-muted-foreground">
            Insights will appear once your documents are analyzed.
          </p>
        ) : insights.documentsAnalyzed === 0 ? (
          <p className="max-w-[72%] text-[13px] leading-relaxed text-muted-foreground">
            Upload and analyze a document to surface related judgments and
            relevant sections of law.
          </p>
        ) : (
          <p className="max-w-[72%] text-[13px] leading-relaxed text-muted-foreground">
            Across your{" "}
            <span className="font-semibold text-foreground">
              {insights.documentsAnalyzed}
            </span>{" "}
            analyzed document{insights.documentsAnalyzed === 1 ? "" : "s"}, we
            found{" "}
            <span className="font-semibold text-foreground">
              {insights.relatedJudgments}
            </span>{" "}
            related judgment{insights.relatedJudgments === 1 ? "" : "s"} and{" "}
            <span className="font-semibold text-foreground">
              {insights.relevantSections}
            </span>{" "}
            relevant section{insights.relevantSections === 1 ? "" : "s"} of law.
          </p>
        )}
        <span className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-300/50">
          <Bot className="h-6 w-6" />
        </span>
      </div>

      <Link
        href="/dashboard/research"
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-[11px] font-semibold text-violet-500 shadow-sm transition hover:bg-violet-600 hover:text-white"
      >
        View Insights
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
