"use client";

import { RefreshCw } from "lucide-react";
import { useAdminHealth } from "@/hooks/use-admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { HealthStrip } from "@/components/admin/health-strip";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

/** Live subsystem health monitor (database, queues, AI, storage). */
export default function AdminHealthPage() {
  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useAdminHealth();

  return (
    <>
      <AdminPageHeader
        title="System Health"
        description="Live probes across every platform subsystem. Auto-refreshes every 30s."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "System Health" }]}
        actions={
          <div className="flex items-center gap-3">
            {dataUpdatedAt > 0 && <span className="hidden text-xs text-muted-foreground sm:inline">Updated {formatDateTime(new Date(dataUpdatedAt).toISOString())}</span>}
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Refresh
            </Button>
          </div>
        }
      />

      <HealthStrip checks={data} loading={isLoading} />

      <div className="mt-4 rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Subsystem detail</h3>
        </div>
        <ul className="divide-y divide-border">
          {data?.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{c.label}</p>
                <p className="truncate text-xs text-muted-foreground">{c.detail ?? "—"}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {c.latencyMs !== null && <span className="tabular-nums text-muted-foreground">{c.latencyMs}ms</span>}
                <span className="font-medium capitalize text-foreground">{c.state}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
