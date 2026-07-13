"use client";

import * as React from "react";
import { Sparkles, Coins, Timer, CheckCircle2, XCircle } from "lucide-react";
import { useAdminAiUsage } from "@/hooks/use-admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { ChartCard, TrendAreaChart, DonutChart } from "@/components/admin/charts";
import { DataTable } from "@/components/admin/data-table";
import { formatCompact, formatNumber, formatUsd } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";

type ProviderRow = { provider: string; requests: number; tokens: number; costUsd: number; avgLatencyMs: number; failed: number };
type ModuleRow = { module: string; requests: number; tokens: number };

export default function AdminAiUsagePage() {
  const [days, setDays] = React.useState(30);
  const { data, isLoading } = useAdminAiUsage({ days });
  const s = data?.summary;

  const providerCols = React.useMemo<ColumnDef<ProviderRow, unknown>[]>(
    () => [
      { accessorKey: "provider", header: "Provider", cell: ({ row }) => <span className="font-medium capitalize text-foreground">{row.original.provider}</span> },
      { accessorKey: "requests", header: "Requests", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.requests)}</span> },
      { accessorKey: "tokens", header: "Tokens", cell: ({ row }) => <span className="tabular-nums">{formatCompact(row.original.tokens)}</span> },
      { accessorKey: "costUsd", header: "Cost", cell: ({ row }) => <span className="tabular-nums">{formatUsd(row.original.costUsd)}</span> },
      { accessorKey: "avgLatencyMs", header: "Avg Latency", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.avgLatencyMs)}ms</span> },
      { accessorKey: "failed", header: "Failed", cell: ({ row }) => <span className="tabular-nums text-rose-500">{row.original.failed}</span> },
    ],
    []
  );

  const moduleCols = React.useMemo<ColumnDef<ModuleRow, unknown>[]>(
    () => [
      { accessorKey: "module", header: "Module", cell: ({ row }) => <span className="font-medium text-foreground">{row.original.module}</span> },
      { accessorKey: "requests", header: "Requests", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.requests)}</span> },
      { accessorKey: "tokens", header: "Tokens", cell: ({ row }) => <span className="tabular-nums">{formatCompact(row.original.tokens)}</span> },
    ],
    []
  );

  return (
    <>
      <AdminPageHeader
        title="AI Usage Analytics"
        description="Requests, tokens, cost, and latency across every AI provider and module."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "AI Usage" }]}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total Requests" value={formatNumber(s?.totalRequests)} icon={Sparkles} accent="violet" loading={isLoading} />
        <KpiCard label="Success Rate" value={`${s?.successRate ?? 0}%`} icon={CheckCircle2} accent="emerald" loading={isLoading} hint={`${formatNumber(s?.failedRequests)} failed`} />
        <KpiCard label="Tokens Used" value={formatCompact(s?.totalTokens)} icon={Coins} accent="amber" loading={isLoading} hint={`${formatUsd(s?.totalCostUsd)} est.`} />
        <KpiCard label="Avg Latency" value={`${formatNumber(s?.avgLatencyMs)}ms`} icon={Timer} accent="blue" loading={isLoading} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Request Volume" subtitle={`AI requests per day (${days}d)`} loading={isLoading}>
            <TrendAreaChart data={data?.trend ?? []} color="#f59e0b" />
          </ChartCard>
        </div>
        <ChartCard title="By Module" subtitle="Share of requests" loading={isLoading}>
          <DonutChart data={(data?.byModule ?? []).slice(0, 8).map((m) => ({ name: m.module, value: m.requests }))} />
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Providers</h3>
          <DataTable columns={providerCols} data={data?.byProvider ?? []} loading={isLoading} emptyMessage="No AI activity yet." />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Modules</h3>
          <DataTable columns={moduleCols} data={data?.byModule ?? []} loading={isLoading} emptyMessage="No AI activity yet." />
        </div>
      </div>
    </>
  );
}
