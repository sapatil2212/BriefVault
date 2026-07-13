"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import type { HealthCheck, HealthState } from "@/types/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATE_META: Record<HealthState, { Icon: typeof CheckCircle2; tone: string; ring: string; label: string }> = {
  operational: { Icon: CheckCircle2, tone: "text-emerald-500", ring: "border-emerald-500/30 bg-emerald-500/5", label: "Operational" },
  degraded: { Icon: AlertTriangle, tone: "text-amber-500", ring: "border-amber-500/30 bg-amber-500/5", label: "Degraded" },
  down: { Icon: XCircle, tone: "text-rose-500", ring: "border-rose-500/30 bg-rose-500/5", label: "Down" },
  unknown: { Icon: HelpCircle, tone: "text-slate-400", ring: "border-border bg-muted/40", label: "Unknown" },
};

/** Horizontal system-health strip. Reused on the overview and health pages. */
export function HealthStrip({ checks, loading }: { checks?: HealthCheck[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {checks?.map((c) => {
        const meta = STATE_META[c.state];
        const Icon = meta.Icon;
        return (
          <div key={c.key} className={cn("flex items-center gap-3 rounded-xl border p-3", meta.ring)}>
            <Icon className={cn("h-6 w-6 shrink-0", meta.tone)} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{c.label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {meta.label}
                {c.latencyMs !== null && ` · ${c.latencyMs}ms`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
