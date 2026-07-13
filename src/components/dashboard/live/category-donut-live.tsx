"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { cn } from "@/lib/utils";

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#94a3b8", "#ec4899"];

/** Top document categories donut, powered by live counts + Recharts. */
export function CategoryDonutLive() {
  const { data, isLoading } = useDashboardStats();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const total = data?.categories.reduce((sum, c) => sum + c.count, 0) ?? 0;
  const slices =
    data?.categories.map((c, i) => ({
      name: c.label,
      value: c.count,
      color: COLORS[i % COLORS.length],
      pct: total ? Math.round((c.count / total) * 100) : 0,
    })) ?? [];

  return (
    <div className="h-full rounded-xl border border-border bg-card p-4 flex flex-col">
      <h2 className="text-[15px] font-semibold text-foreground">Top Document Categories</h2>

      {isLoading ? (
        <div className="mt-6 flex-1 flex items-center justify-center">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
      ) : total === 0 ? (
        <EmptyState
          className="mt-4 border-0 p-6 flex-1 flex flex-col justify-center"
          icon={FolderOpen}
          title="No documents yet"
          description="Categories appear once you upload documents."
        />
      ) : (
        <div className="mt-4 flex-1 flex flex-col items-center justify-center gap-5">
          {/* Donut Container */}
          <div className="relative h-[132px] w-[132px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  innerRadius={44}
                  outerRadius={64}
                  paddingAngle={3}
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {slices.map((s, idx) => (
                    <Cell
                      key={s.name}
                      fill={s.color}
                      className="cursor-pointer transition-opacity duration-200"
                      opacity={activeIndex === null || activeIndex === idx ? 1 : 0.4}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Info HUD */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-2.5">
              {activeIndex !== null && slices[activeIndex] ? (
                <>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate max-w-full">
                    {slices[activeIndex].name}
                  </span>
                  <span className="text-[13px] font-bold text-violet-500 mt-0.5">
                    {slices[activeIndex].value} doc{slices[activeIndex].value === 1 ? "" : "s"}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                    {slices[activeIndex].pct}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-foreground tracking-tight">{total}</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total Docs</span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Legend List */}
          <ul className="w-full max-w-[240px] space-y-1">
            {slices.map((s, idx) => (
              <li
                key={s.name}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={cn(
                  "flex items-center justify-center gap-3 text-[13px] px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer",
                  activeIndex === idx
                    ? "bg-violet-500/10 text-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full transition-transform duration-200",
                      activeIndex === idx && "scale-125"
                    )}
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </span>
                <span
                  className={cn(
                    "text-[12px] font-semibold transition-colors duration-200",
                    activeIndex === idx ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"
                  )}
                >
                  {s.pct}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
