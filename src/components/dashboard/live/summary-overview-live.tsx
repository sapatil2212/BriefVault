"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-2.5 text-[12px] shadow-lg">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((entry) => (
            <p
              key={entry.name}
              className="flex items-center gap-1.5 font-medium"
              style={{ color: entry.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="capitalize">{entry.name}</span>:{" "}
              <span className="font-bold text-foreground">{entry.value}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Document Summary Overview — compares uploaded vs. summarized documents.
 * Rebuilt using Recharts for premium animations and hover interaction.
 */
export function SummaryOverviewLive() {
  const { data, isLoading, isError } = useDashboardStats();

  const trend = data?.trend;
  const totalPoints =
    (trend?.uploaded.reduce((a, b) => a + b, 0) ?? 0) +
    (trend?.summarized.reduce((a, b) => a + b, 0) ?? 0);

  const chartData = React.useMemo(() => {
    if (!trend) return [];
    return trend.labels.map((label, idx) => ({
      name: label,
      uploaded: trend.uploaded[idx] ?? 0,
      summarized: trend.summarized[idx] ?? 0,
    }));
  }, [trend]);

  return (
    <div className="h-full rounded-xl border border-border bg-card p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">
            Document Summary Overview
          </h2>
          <span className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            Last 6 weeks
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" /> Uploaded
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]" /> Summarized
          </span>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-48 w-full" />
      ) : isError ? (
        <p className="mt-4 text-[13px] text-red-600 dark:text-red-400">
          Couldn&apos;t load chart.
        </p>
      ) : totalPoints === 0 ? (
        <EmptyState
          className="mt-4 border-0 p-8 flex-1 flex flex-col justify-center"
          icon={TrendingUp}
          title="No trend data yet"
          description="Upload and summarize documents to see your activity over time."
        />
      ) : (
        <div className="mt-4 h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorUploaded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSummarized" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="uploaded"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUploaded)"
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="summarized"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSummarized)"
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
