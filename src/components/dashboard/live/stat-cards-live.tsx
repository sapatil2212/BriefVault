"use client";

import { FileText, FileType2, Clock, Lightbulb, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { formatHoursSaved } from "@/lib/format";

type Tone = "violet" | "emerald" | "sky" | "amber";
const toneStyles: Record<Tone, string> = {
  violet: "bg-violet-500/10 text-violet-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  sky: "bg-sky-500/10 text-sky-500",
  amber: "bg-amber-500/10 text-amber-500",
};

function Card({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneStyles[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2.5 text-2xl font-bold text-foreground">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span> : null}
      </p>
      <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">{sub}</p>
    </div>
  );
}

/** KPI row driven by live `/api/dashboard/stats`. */
export function StatCardsLive() {
  const { data, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-600 dark:text-red-400">
        Couldn&apos;t load statistics. Please refresh.
      </div>
    );
  }

  const hours = formatHoursSaved(data.readingTimeSavedMinutes);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        label="Documents Uploaded"
        value={String(data.totalDocuments)}
        sub={`${data.pending} pending`}
        icon={FileText}
        tone="violet"
      />
      <Card
        label="Summaries Generated"
        value={String(data.summariesGenerated)}
        sub={`${data.processed} processed`}
        icon={FileType2}
        tone="emerald"
      />
      <Card
        label="Hours Saved"
        value={hours.value}
        unit={hours.unit}
        sub="Estimated reading time"
        icon={Clock}
        tone="sky"
      />
      <Card
        label="Insights Extracted"
        value={String(data.insightsExtracted)}
        sub={`${data.failed} failed`}
        icon={Lightbulb}
        tone="amber"
      />
    </div>
  );
}
