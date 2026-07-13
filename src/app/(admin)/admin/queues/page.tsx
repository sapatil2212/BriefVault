"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCw, XCircle, RotateCw } from "lucide-react";
import { useAdminQueues, useQueueAction } from "@/hooks/use-admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusPill } from "@/components/admin/status-pill";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QueueJobRow } from "@/types/admin";
import type { ColumnDef } from "@tanstack/react-table";

const JOB_STATUSES = ["", "PENDING", "RUNNING", "SUCCEEDED", "FAILED"];

export default function AdminQueuesPage() {
  const [type, setType] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useAdminQueues({ type: type || undefined, status: status || undefined, page });
  const act = useQueueAction();

  async function run(fn: () => Promise<unknown>, msg: string) {
    try {
      await fn();
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    }
  }

  const columns = React.useMemo<ColumnDef<QueueJobRow, unknown>[]>(
    () => [
      { accessorKey: "type", header: "Type", cell: ({ row }) => <span className="font-medium text-foreground">{row.original.type}</span> },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill value={row.original.status} /> },
      { accessorKey: "attempts", header: "Attempts", cell: ({ row }) => <span className="tabular-nums">{row.original.attempts}/{row.original.maxAttempts}</span> },
      { accessorKey: "lastError", header: "Last Error", cell: ({ row }) => <span className="line-clamp-1 max-w-[280px] text-xs text-rose-500">{row.original.lastError ?? "—"}</span> },
      { accessorKey: "createdAt", header: "Created", cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDateTime(row.original.createdAt)}</span> },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const j = row.original;
          return (
            <div className="flex justify-end gap-1.5">
              {j.status === "FAILED" && (
                <Button variant="outline" size="sm" onClick={() => run(() => act.mutateAsync({ action: "retry", jobId: j.id }), "Job re-queued.")}>
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </Button>
              )}
              {j.status === "PENDING" && (
                <Button variant="outline" size="sm" onClick={() => run(() => act.mutateAsync({ action: "cancel", jobId: j.id }), "Job cancelled.")}>
                  <XCircle className="h-3.5 w-3.5" /> Cancel
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [act]
  );

  const meta = data?.meta;

  return (
    <>
      <AdminPageHeader
        title="Queue Monitoring"
        description="Durable background job queue across upload, OCR, embedding, AI, and report workers."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Queues" }]}
        actions={
          <Button variant="outline" size="sm" onClick={() => run(() => act.mutateAsync({ action: "retryAllFailed", type: type || undefined }), "Failed jobs re-queued.")}>
            <RotateCw className="h-4 w-4" /> Retry all failed
          </Button>
        }
      />

      {/* Per-queue summary cards */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />)}
        {data?.summary.map((q) => (
          <button
            key={q.type}
            onClick={() => { setType(type === q.type ? "" : q.type); setPage(1); }}
            className={cn("rounded-xl border p-4 text-left transition-colors", type === q.type ? "border-violet-500 bg-violet-500/5" : "border-border bg-card hover:bg-muted/40")}
          >
            <p className="truncate text-sm font-semibold text-foreground">{q.type}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{q.total}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              {q.pending > 0 && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">{q.pending} pending</span>}
              {q.running > 0 && <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-600 dark:text-blue-400">{q.running} running</span>}
              {q.failed > 0 && <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-rose-600 dark:text-rose-400">{q.failed} failed</span>}
              {q.succeeded > 0 && <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400">{q.succeeded} ok</span>}
            </div>
          </button>
        ))}
        {!isLoading && data?.summary.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No queued jobs.</p>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.jobs ?? []}
        loading={isLoading}
        emptyMessage="No jobs match your filters."
        pagination={meta ? { page: meta.page, pageCount: meta.pageCount, total: meta.total } : undefined}
        onPageChange={setPage}
        toolbar={
          <div className="flex w-full flex-wrap items-center gap-2">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground">
              {JOB_STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
            </select>
            {(type || status) && (
              <Button variant="outline" size="sm" onClick={() => { setType(""); setStatus(""); setPage(1); }}>Clear filters</Button>
            )}
            {type && <span className="text-sm text-muted-foreground">Filtered: <span className="font-medium text-foreground">{type}</span></span>}
          </div>
        }
      />
    </>
  );
}
