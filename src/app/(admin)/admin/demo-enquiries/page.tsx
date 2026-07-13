"use client";

import * as React from "react";
import { toast } from "sonner";
import { Search, CalendarClock, Mail, Phone, Eye, Pencil, Trash2 } from "lucide-react";
import {
  useAdminDemoEnquiries,
  useDeleteDemoEnquiry,
  type DemoEnquiryQuery,
  type DemoEnquiryRow,
} from "@/hooks/use-admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable, sortableHeader } from "@/components/admin/data-table";
import { StatusPill } from "@/components/admin/status-pill";
import { DemoEnquiryDialog } from "@/components/admin/demo-enquiry-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatDate, timeAgo } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";

const STATUS_OPTIONS = ["NEW", "CONTACTED", "SCHEDULED", "CLOSED"] as const;

/**
 * Super Admin "Demo Enquiries" module — every "Book a demo" / contact form
 * submission from the public site lands here for triage. Admins can filter by
 * status and update an enquiry's status inline as they follow up.
 */
export default function AdminDemoEnquiriesPage() {
  const [query, setQuery] = React.useState<DemoEnquiryQuery>({ page: 1, pageSize: 20 });
  const [searchInput, setSearchInput] = React.useState("");
  const { data, isLoading } = useAdminDemoEnquiries(query);
  const deleteEnquiry = useDeleteDemoEnquiry();
  const confirm = useConfirm();

  // Which enquiry the view/edit dialog is open for, and in which mode.
  const [dialog, setDialog] = React.useState<{ id: string; editMode: boolean } | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setQuery((q) => ({ ...q, search: searchInput || undefined, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const counts = data?.meta?.counts ?? {};

  const handleDelete = React.useCallback(
    async (row: DemoEnquiryRow) => {
      const ok = await confirm({
        title: "Delete this enquiry?",
        description: `This will permanently remove the demo request from ${row.name} (${row.company}). This cannot be undone.`,
        confirmLabel: "Delete",
        tone: "danger",
      });
      if (!ok) return;
      try {
        await deleteEnquiry.mutateAsync(row.id);
        toast.success("Enquiry deleted.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed.");
      }
    },
    [confirm, deleteEnquiry]
  );

  const columns = React.useMemo<ColumnDef<DemoEnquiryRow, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Applicant"),
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-foreground">{row.original.name}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" /> {row.original.email}
            </div>
          </div>
        ),
      },
      { accessorKey: "company", header: sortableHeader("Company") },
      { accessorKey: "businessType", header: "Business type" },
      {
        accessorKey: "phone",
        header: "Contact",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" /> {row.original.phone}
          </span>
        ),
      },
      {
        id: "preferred",
        header: "Preferred slot",
        cell: ({ row }) =>
          row.original.preferredDate ? (
            <span className="inline-flex items-center gap-1 text-sm text-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
              {formatDate(row.original.preferredDate)}
              {row.original.preferredTime ? ` · ${row.original.preferredTime}` : ""}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: sortableHeader("Submitted"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground" title={formatDate(row.original.createdAt)}>
            {timeAgo(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusPill value={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setDialog({ id: row.original.id, editMode: false })}
              aria-label="View enquiry"
              title="View"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDialog({ id: row.original.id, editMode: true })}
              aria-label="Edit enquiry"
              title="Edit"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              aria-label="Delete enquiry"
              title="Delete"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete]
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name, email, company…"
          className="h-9 w-64 pl-9 text-sm"
        />
      </div>
      <Select
        value={query.status ?? ""}
        onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value || undefined, page: 1 }))}
        className="h-9 w-40 text-sm"
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <div>
      <AdminPageHeader
        title="Demo Enquiries"
        description="Every 'Book a demo' request from the public site, ready for follow-up."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Demo Enquiries" }]}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <CalendarClock className="h-3.5 w-3.5" />
            {counts.NEW ?? 0} new
          </span>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        toolbar={toolbar}
        emptyMessage="No demo enquiries yet."
        pagination={
          data?.meta
            ? { page: data.meta.page, pageCount: data.meta.pageCount, total: data.meta.total }
            : undefined
        }
        onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
      />

      <DemoEnquiryDialog
        enquiryId={dialog?.id ?? null}
        editMode={dialog?.editMode ?? false}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
