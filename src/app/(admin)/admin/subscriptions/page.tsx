"use client";

import * as React from "react";
import { CreditCard, IndianRupee, CheckCircle2, Clock, Search } from "lucide-react";
import { useAdminSubscriptions, type SubscriptionQuery } from "@/hooks/use-admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable, sortableHeader } from "@/components/admin/data-table";
import { KpiCard } from "@/components/admin/kpi-card";
import { StatusPill } from "@/components/admin/status-pill";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { formatPlanPrice } from "@/lib/plans/types";
import type { AdminSubscriptionRow } from "@/types/admin";
import type { ColumnDef } from "@tanstack/react-table";

const STATUSES = ["", "ACTIVE", "PENDING", "EXPIRED", "CANCELLED"];
const PLANS = ["", "FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];

/**
 * Subscription management — live view of every subscription joined with its
 * subscriber and plan, plus headline metrics (active count, MRR, pending).
 * All data comes from the Plan / Subscription tables.
 */
export default function AdminSubscriptionsPage() {
  const [query, setQuery] = React.useState<SubscriptionQuery>({ page: 1, pageSize: 20 });
  const [searchInput, setSearchInput] = React.useState("");
  const { data, isLoading } = useAdminSubscriptions(query);
  const stats = data?.meta?.stats;

  React.useEffect(() => {
    const t = setTimeout(() => setQuery((q) => ({ ...q, search: searchInput || undefined, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const columns = React.useMemo<ColumnDef<AdminSubscriptionRow, unknown>[]>(
    () => [
      {
        accessorKey: "userName",
        header: sortableHeader("Subscriber"),
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-foreground">{row.original.userName}</div>
            <div className="text-xs text-muted-foreground">{row.original.userEmail}</div>
          </div>
        ),
      },
      { accessorKey: "organization", header: sortableHeader("Organization") },
      {
        accessorKey: "planName",
        header: "Plan",
        cell: ({ row }) => <StatusPill value={row.original.planKey} />,
      },
      {
        accessorKey: "priceMonthly",
        header: "Price",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {formatPlanPrice(row.original.priceMonthly, row.original.currency)}
            {row.original.priceMonthly > 0 && <span className="text-muted-foreground"> / mo</span>}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusPill value={row.original.status} />,
      },
      {
        accessorKey: "currentPeriodEnd",
        header: sortableHeader("Renews"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.currentPeriodEnd ? formatDate(row.original.currentPeriodEnd) : "—"}
          </span>
        ),
      },
    ],
    []
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search subscriber, org…"
          className="h-9 w-64 pl-9 text-sm"
        />
      </div>
      <Select
        value={query.status ?? ""}
        onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value || undefined, page: 1 }))}
        className="h-9 w-40 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s ? s.charAt(0) + s.slice(1).toLowerCase() : "All statuses"}
          </option>
        ))}
      </Select>
      <Select
        value={query.plan ?? ""}
        onChange={(e) => setQuery((q) => ({ ...q, plan: e.target.value || undefined, page: 1 }))}
        className="h-9 w-40 text-sm"
      >
        {PLANS.map((p) => (
          <option key={p} value={p}>
            {p ? p.charAt(0) + p.slice(1).toLowerCase() : "All plans"}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <div>
      <AdminPageHeader
        title="Subscriptions"
        description="Every plan assignment across the platform, with live revenue metrics."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Subscriptions" }]}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Active subscriptions" value={stats?.active ?? 0} icon={CheckCircle2} accent="emerald" loading={isLoading} />
        <KpiCard
          label="Monthly recurring revenue"
          value={`₹${(stats?.mrr ?? 0).toLocaleString("en-IN")}`}
          icon={IndianRupee}
          accent="violet"
          hint="From active paid plans"
          loading={isLoading}
        />
        <KpiCard label="Pending / awaiting" value={stats?.pending ?? 0} icon={Clock} accent="amber" loading={isLoading} />
        <KpiCard label="Total subscriptions" value={stats?.total ?? 0} icon={CreditCard} accent="blue" loading={isLoading} />
      </div>

      {stats && stats.perPlan.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {stats.perPlan.map((p) => (
            <span
              key={p.key}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs"
            >
              <StatusPill value={p.key} />
              <span className="font-semibold text-foreground">{p.active}</span>
              <span className="text-muted-foreground">active</span>
            </span>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        toolbar={toolbar}
        emptyMessage="No subscriptions yet."
        pagination={
          data?.meta
            ? { page: data.meta.page, pageCount: data.meta.pageCount, total: data.meta.total }
            : undefined
        }
        onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
      />
    </div>
  );
}
