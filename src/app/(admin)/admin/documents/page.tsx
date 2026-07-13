"use client";

import * as React from "react";
import { toast } from "sonner";
import { Search, RefreshCw, FileText, FileCheck2, Loader2, AlertCircle } from "lucide-react";
import { useAdminDocuments, useRetryDocument } from "@/hooks/use-admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusPill } from "@/components/admin/status-pill";
import { KpiCard } from "@/components/admin/kpi-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDateTime } from "@/lib/format";
import type { AdminDocumentRow } from "@/types/admin";
import type { ColumnDef } from "@tanstack/react-table";

const STATUSES = ["", "UPLOADED", "PROCESSING", "READY", "FAILED"];

export default function AdminDocumentsPage() {
  const [status, setStatus] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useAdminDocuments({ status: status || undefined, search: debounced || undefined, page });
  const retry = useRetryDocument();

  React.useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const counts = data?.meta?.counts;

  async function onRetry(id: string) {
    try {
      await retry.mutateAsync(id);
      toast.success("Document re-queued for processing.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed.");
    }
  }

  const columns = React.useMemo<ColumnDef<AdminDocumentRow, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Document",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.original.title}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.kind} · {formatBytes(row.original.sizeBytes)}{row.original.pageCount ? ` · ${row.original.pageCount}p` : ""}</p>
          </div>
        ),
      },
      { accessorKey: "ownerEmail", header: "Owner", cell: ({ row }) => (
        <div className="min-w-0"><p className="truncate text-sm text-foreground">{row.original.ownerName}</p><p className="truncate text-xs text-muted-foreground">{row.original.organization}</p></div>
      ) },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill value={row.original.status} /> },
      { accessorKey: "createdAt", header: "Uploaded", cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDateTime(row.original.createdAt)}</span> },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.status === "FAILED" ? (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => onRetry(row.original.id)} disabled={retry.isPending}>
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : null,
      },
    ],
    [retry.isPending]
  );

  const meta = data?.meta;

  return (
    <>
      <AdminPageHeader
        title="Document Monitoring"
        description="Cross-tenant view of the document pipeline. Retry failed processing jobs."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Documents" }]}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Uploaded" value={counts?.UPLOADED ?? 0} icon={FileText} accent="slate" loading={isLoading} />
        <KpiCard label="Processing" value={counts?.PROCESSING ?? 0} icon={Loader2} accent="blue" loading={isLoading} />
        <KpiCard label="Ready" value={counts?.READY ?? 0} icon={FileCheck2} accent="emerald" loading={isLoading} />
        <KpiCard label="Failed" value={counts?.FAILED ?? 0} icon={AlertCircle} accent="rose" loading={isLoading} />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        emptyMessage="No documents match your filters."
        pagination={meta ? { page: meta.page, pageCount: meta.pageCount, total: meta.total } : undefined}
        onPageChange={setPage}
        toolbar={
          <div className="flex w-full flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search document titles..." className="pl-9" />
            </div>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground">
              {STATUSES.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
            </select>
          </div>
        }
      />
    </>
  );
}
