"use client";

import * as React from "react";
import { Search, Building2 } from "lucide-react";
import { useAdminOrganizations } from "@/hooks/use-admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusPill } from "@/components/admin/status-pill";
import { Input } from "@/components/ui/input";
import { formatBytes, formatDate, formatNumber } from "@/lib/format";
import type { AdminOrganizationRow } from "@/types/admin";
import type { ColumnDef } from "@tanstack/react-table";

/**
 * Organization directory. Aggregated from user + document + AI data today
 * (organizations are a user field; see org-service.ts). Filters and pagination
 * are server-driven.
 */
export default function AdminOrganizationsPage() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [debounced, setDebounced] = React.useState("");
  const { data, isLoading } = useAdminOrganizations({ search: debounced || undefined, page });

  React.useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const columns = React.useMemo<ColumnDef<AdminOrganizationRow, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Organization",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Building2 className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{row.original.name}</p>
              <p className="truncate text-xs text-muted-foreground">{row.original.orgType?.replace(/_/g, " ").toLowerCase()}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "userCount", header: "Users", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.userCount)}</span> },
      { accessorKey: "activeUserCount", header: "Active", cell: ({ row }) => <span className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatNumber(row.original.activeUserCount)}</span> },
      { accessorKey: "documentCount", header: "Documents", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.documentCount)}</span> },
      { accessorKey: "storageBytes", header: "Storage", cell: ({ row }) => <span className="tabular-nums">{formatBytes(row.original.storageBytes)}</span> },
      { accessorKey: "aiRequests", header: "AI Requests", cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.aiRequests)}</span> },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill value={row.original.status} /> },
      { accessorKey: "createdAt", header: "Since", cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span> },
    ],
    []
  );

  const meta = data?.meta;

  return (
    <>
      <AdminPageHeader
        title="Organizations"
        description="Every tenant on the platform with usage, storage, and AI consumption at a glance."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Organizations" }]}
        actions={meta && <span className="text-sm text-muted-foreground">{meta.total} organizations</span>}
      />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        emptyMessage="No organizations found."
        pagination={meta ? { page: meta.page, pageCount: meta.pageCount, total: meta.total } : undefined}
        onPageChange={setPage}
        toolbar={
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search organizations..." className="pl-9" />
          </div>
        }
      />
    </>
  );
}
