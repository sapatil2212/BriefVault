"use client";

import * as React from "react";
import {
  Building2,
  Users,
  UserCheck,
  FileText,
  HardDrive,
  Coins,
  CreditCard,
} from "lucide-react";
import { useAdminOverview } from "@/hooks/use-admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { ChartCard, TrendAreaChart, TrendBarChart, TrendLineChart } from "@/components/admin/charts";
import { StatusPill } from "@/components/admin/status-pill";
import { HealthStrip } from "@/components/admin/health-strip";
import { formatBytes, formatCompact, formatNumber, formatUsd } from "@/lib/format";

/**
 * Platform overview — the operations dashboard landing page. Real-time KPIs,
 * eight trend charts, and a live system-health strip, all sourced from
 * `/api/admin/overview` (polls every 60s).
 */
export default function AdminOverviewPage() {
  const { data, isLoading } = useAdminOverview(30);
  const k = data?.kpis;

  return (
    <>
      <AdminPageHeader
        title="Platform Overview"
        description="Real-time operational snapshot across every organization, user, and AI workload."
        breadcrumbs={[{ label: "Admin" }, { label: "Overview" }]}
        actions={data && <StatusPill value="operational" />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <KpiCard label="Organizations" value={formatNumber(k?.totalOrganizations)} icon={Building2} accent="violet" loading={isLoading} delta={k?.monthlyGrowthPct} hint="vs last month" />
        <KpiCard label="Total Users" value={formatNumber(k?.totalUsers)} icon={Users} accent="blue" loading={isLoading} hint={`${formatNumber(k?.newUsers30d)} new in 30d`} />
        <KpiCard label="Active Users" value={formatNumber(k?.activeUsers)} icon={UserCheck} accent="emerald" loading={isLoading} hint="with live sessions" />
        <KpiCard label="Suspended" value={formatNumber(k?.suspendedUsers)} icon={Users} accent="rose" loading={isLoading} />
        <KpiCard label="Documents" value={formatNumber(k?.documentsUploaded)} icon={FileText} accent="violet" loading={isLoading} />
        <KpiCard label="Storage" value={formatBytes(k?.storageBytes)} icon={HardDrive} accent="slate" loading={isLoading} />
        <KpiCard label="Tokens" value={formatCompact(k?.tokensConsumed)} icon={Coins} accent="violet" loading={isLoading} hint={`${formatUsd(k?.estimatedCostUsd)} est. cost`} />
        <KpiCard label="Active Subscriptions" value={formatNumber(k?.activeSubscriptions)} icon={CreditCard} accent="violet" loading={isLoading} hint="live paid + free plans" />
      </div>

      <div className="mt-4">
        <HealthStrip checks={data?.health} loading={isLoading} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="User Growth" subtitle="New signups per day (30d)" loading={isLoading}>
          <TrendAreaChart data={data?.charts.userGrowth ?? []} color="#2563eb" />
        </ChartCard>
        <ChartCard title="Organization Growth" subtitle="Cumulative organizations" loading={isLoading}>
          <TrendLineChart data={data?.charts.orgGrowth ?? []} color="#7c3aed" />
        </ChartCard>
        <ChartCard title="Document Uploads" subtitle="Uploads per day" loading={isLoading}>
          <TrendBarChart data={data?.charts.documentUploads ?? []} color="#8b5cf6" />
        </ChartCard>
        <ChartCard title="AI Usage" subtitle="AI requests per day" loading={isLoading}>
          <TrendAreaChart data={data?.charts.aiUsage ?? []} color="#f59e0b" />
        </ChartCard>
        <ChartCard title="Token Consumption" subtitle="Tokens per day" loading={isLoading}>
          <TrendBarChart data={data?.charts.tokenConsumption ?? []} color="#0ea5e9" valueFormat={formatCompact} />
        </ChartCard>
        <ChartCard title="Storage Growth" subtitle="Cumulative bytes stored" loading={isLoading}>
          <TrendAreaChart data={data?.charts.storageGrowth ?? []} color="#10b981" valueFormat={formatBytes} />
        </ChartCard>
        <ChartCard title="Avg Processing Time" subtitle="Mean AI latency per day (ms)" loading={isLoading}>
          <TrendLineChart data={data?.charts.avgProcessingMs ?? []} color="#ef4444" valueFormat={(v) => `${formatCompact(v)}ms`} />
        </ChartCard>
        <ChartCard title="API Requests" subtitle="Request volume per day" loading={isLoading}>
          <TrendBarChart data={data?.charts.apiRequests ?? []} color="#14b8a6" />
        </ChartCard>
      </div>
    </>
  );
}
