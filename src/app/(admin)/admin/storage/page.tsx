"use client";

import * as React from "react";
import { HardDrive, Building2, FileText, Database } from "lucide-react";
import { useAdminOverview, useAdminOrganizations } from "@/hooks/use-admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { ChartCard, TrendAreaChart, DonutChart } from "@/components/admin/charts";
import { DataTable } from "@/components/admin/data-table";
import { formatBytes, formatNumber } from "@/lib/format";
import type { AdminOrganizationRow } from "@/types/admin";
import type { ColumnDef } from "@tanstack/react-table";

/**
 * Storage management. Totals + growth come from the overview aggregate;
 * per-organization distribution reuses the org analytics service. All real
 * data — the storage backend is filesystem/S3-compatible via the storage
 * provider abstraction.
 */
export default function AdminStoragePage() {
  const { data: overview, isLoading: loadingOverview } = useAdminOverview(30);
  const { data: orgs, isLoading: loadingOrgs } = useAdminOrganizations({ page: 1 });

  const k = overview?.kpis;
  const orgRows = orgs?.items ?? [];
  const topByStorage = React.useMemo(() => [...orgRows].sort((a, b) => b.storageBytes - a.storageBytes).slice(0, 8), [orgRows]);

  const columns = React.useMemo<ColumnDef<AdminOrganizationRow, unknown>[]>(
    () => [
      { accessorKey: "name", header: "Organization", cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span> },
      { accessorKey: "documentCount", header: "Documents", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.documentCount)}</span> },
      { accessorKey: "storageBytes", header: "Storage Used", cell: ({ row }) => <span className="tabular-nums font-medium text-foreground">{formatBytes(row.original.storageBytes)}</span> },
    ],
    []
  );

  return (
    <>
      <AdminPageHeader
        title="Storage Management"
        description="Platform-wide storage consumption, growth, and distribution across organizations."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Storage" }]}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total Storage" value={formatBytes(k?.storageBytes)} icon={HardDrive} accent="violet" loading={loadingOverview} />
        <KpiCard label="Documents" value={formatNumber(k?.documentsUploaded)} icon={FileText} accent="blue" loading={loadingOverview} />
        <KpiCard label="Organizations" value={formatNumber(k?.totalOrganizations)} icon={Building2} accent="emerald" loading={loadingOverview} />
        <KpiCard label="Avg / Org" value={formatBytes(k && k.totalOrganizations ? Math.round(k.storageBytes / k.totalOrganizations) : 0)} icon={Database} accent="slate" loading={loadingOverview} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Storage Growth" subtitle="Cumulative bytes (30d)" loading={loadingOverview}>
            <TrendAreaChart data={overview?.charts.storageGrowth ?? []} color="#10b981" valueFormat={formatBytes} />
          </ChartCard>
        </div>
        <ChartCard title="Distribution" subtitle="Top organizations by storage" loading={loadingOrgs}>
          <DonutChart data={topByStorage.map((o) => ({ name: o.name, value: o.storageBytes }))} />
        </ChartCard>
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Largest consumers</h3>
        <DataTable columns={columns} data={topByStorage} loading={loadingOrgs} emptyMessage="No storage recorded yet." />
      </div>
    </>
  );
}
