"use client";

import * as React from "react";
import { Search, UserCheck } from "lucide-react";
import { useAdminPendingUsers, usePlans, type PendingQuery } from "@/hooks/use-admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable, sortableHeader } from "@/components/admin/data-table";
import { StatusPill } from "@/components/admin/status-pill";
import { PendingUserDialog } from "@/components/admin/pending-user-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { PendingUserRow } from "@/types/admin";
import type { ColumnDef } from "@tanstack/react-table";

/**
 * Super Admin "Pending Users" module — the approval queue. Lists accounts
 * awaiting review (paid-plan signups that verified their email) and opens a
 * detail dialog to approve / reject / request info / change plan.
 */
export default function AdminPendingUsersPage() {
  const [query, setQuery] = React.useState<PendingQuery>({ page: 1, pageSize: 20 });
  const [searchInput, setSearchInput] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { data, isLoading } = useAdminPendingUsers(query);
  const { data: plans } = usePlans();

  React.useEffect(() => {
    const t = setTimeout(() => setQuery((q) => ({ ...q, search: searchInput || undefined, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const columns = React.useMemo<ColumnDef<PendingUserRow, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Name"),
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-foreground">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.email}</div>
          </div>
        ),
      },
      { accessorKey: "organization", header: sortableHeader("Organization") },
      { accessorKey: "phone", header: "Mobile" },
      {
        accessorKey: "planName",
        header: "Plan",
        cell: ({ row }) => <StatusPill value={row.original.planKey ?? "—"} className="capitalize" />,
      },
      {
        accessorKey: "emailVerified",
        header: "Email",
        cell: ({ row }) =>
          row.original.emailVerified ? (
            <span className="text-xs font-medium text-success">Verified</span>
          ) : (
            <span className="text-xs font-medium text-amber-600">Unverified</span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: sortableHeader("Registered"),
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => setSelectedId(row.original.id)}>
            Review
          </Button>
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
          placeholder="Search name, email, org…"
          className="h-9 w-64 pl-9 text-sm"
        />
      </div>
      <Select
        value={query.plan ?? ""}
        onChange={(e) => setQuery((q) => ({ ...q, plan: e.target.value || undefined, page: 1 }))}
        className="h-9 w-44 text-sm"
      >
        <option value="">All plans</option>
        {(plans ?? []).map((p) => (
          <option key={p.key} value={p.key}>
            {p.name}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <div>
      <AdminPageHeader
        title="Pending Users"
        description="Review and approve subscription requests awaiting your decision."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Pending Users" }]}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <UserCheck className="h-3.5 w-3.5" />
            {data?.meta?.total ?? 0} awaiting approval
          </span>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        toolbar={toolbar}
        emptyMessage="No users are awaiting approval."
        pagination={
          data?.meta
            ? { page: data.meta.page, pageCount: data.meta.pageCount, total: data.meta.total }
            : undefined
        }
        onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
      />

      <PendingUserDialog userId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
