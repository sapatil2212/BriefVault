"use client";

import * as React from "react";
import { toast } from "sonner";
import { MoreHorizontal, Search, UserX, UserCheck, KeyRound, LogOut, Trash2, Eye, Pencil, Users as UsersIcon } from "lucide-react";
import { useAdminUsers, useUserAction, useDeleteUser, type UserQuery } from "@/hooks/use-admin";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusPill } from "@/components/admin/status-pill";
import { UserDialog } from "@/components/admin/user-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, timeAgo } from "@/lib/format";
import type { AdminUserRow } from "@/types/admin";
import type { ColumnDef } from "@tanstack/react-table";

const STATUSES = ["", "ACTIVE", "SUSPENDED"];

/**
 * Platform user management. Every account here is a normal portal user (the
 * only other account type, the super admin, is the env-based console login and
 * is not a database user). Actions are limited to lifecycle + credentials:
 * suspend/activate, force logout, reset password, delete.
 */
export default function AdminUsersPage() {
  const [query, setQuery] = React.useState<UserQuery>({ page: 1, pageSize: 20 });
  const [searchInput, setSearchInput] = React.useState("");
  const { data, isLoading } = useAdminUsers(query);
  const action = useUserAction();
  const del = useDeleteUser();
  const confirm = useConfirm();

  // Which user the view/edit dialog is open for, and in which mode.
  const [dialog, setDialog] = React.useState<{ id: string; editMode: boolean } | null>(null);

  // Debounce search input into the query.
  React.useEffect(() => {
    const t = setTimeout(() => setQuery((q) => ({ ...q, search: searchInput || undefined, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const runAction = React.useCallback(
    async (row: AdminUserRow, kind: "suspend" | "activate" | "reset" | "logout" | "delete") => {
      try {
        if (kind === "suspend") {
          if (!(await confirm({ title: `Suspend ${row.email}?`, description: "All active sessions will be revoked immediately and the user won't be able to sign in.", tone: "warning", confirmLabel: "Suspend" }))) return;
          await action.mutateAsync({ id: row.id, action: "setStatus", status: "SUSPENDED" });
          toast.success("User suspended.");
        } else if (kind === "activate") {
          await action.mutateAsync({ id: row.id, action: "setStatus", status: "ACTIVE" });
          toast.success("User activated.");
        } else if (kind === "logout") {
          await action.mutateAsync({ id: row.id, action: "forceLogout" });
          toast.success("Sessions terminated.");
        } else if (kind === "reset") {
          const pwd = crypto.randomUUID().slice(0, 12) + "A1!";
          if (!(await confirm({ title: `Reset password for ${row.email}?`, description: "A new temporary password will be generated and their sessions cleared.", tone: "warning", confirmLabel: "Reset" }))) return;
          await action.mutateAsync({ id: row.id, action: "resetPassword", password: pwd });
          await navigator.clipboard?.writeText(pwd).catch(() => {});
          toast.success("Password reset. Temporary password copied to clipboard.");
        } else if (kind === "delete") {
          if (!(await confirm({ title: `Delete ${row.email}?`, description: "This permanently removes the user and all their documents. This cannot be undone.", tone: "danger", confirmLabel: "Delete" }))) return;
          await del.mutateAsync(row.id);
          toast.success("User deleted.");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed.");
      }
    },
    [action, del, confirm]
  );

  const columns = React.useMemo<ColumnDef<AdminUserRow, unknown>[]>(
    () => [
      {
        accessorKey: "email",
        header: "User",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.original.firstName} {row.original.lastName}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      { accessorKey: "organization", header: "Organization", cell: ({ row }) => (
        <div className="min-w-0"><p className="truncate text-sm text-foreground">{row.original.organization}</p><p className="text-xs text-muted-foreground">{row.original.orgType?.replace(/_/g, " ").toLowerCase()}</p></div>
      ) },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusPill value={row.original.status} /> },
      { accessorKey: "documentCount", header: "Docs", cell: ({ row }) => <span className="tabular-nums">{row.original.documentCount}</span> },
      { accessorKey: "sessionCount", header: "Sessions", cell: ({ row }) => <span className="tabular-nums">{row.original.sessionCount}</span> },
      { accessorKey: "lastLoginAt", header: "Last Login", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.lastLoginAt ? timeAgo(row.original.lastLoginAt) : "Never"}</span> },
      { accessorKey: "createdAt", header: "Joined", cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span> },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => setDialog({ id: u.id, editMode: false })}
                aria-label="View user"
                title="View"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDialog({ id: u.id, editMode: true })}
                aria-label="Edit user"
                title="Edit"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => runAction(u, "delete")}
                aria-label="Delete user"
                title="Delete"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="More actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Manage user</DropdownMenuLabel>
                  {u.status === "ACTIVE" ? (
                    <DropdownMenuItem onClick={() => runAction(u, "suspend")}><UserX /> Suspend</DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => runAction(u, "activate")}><UserCheck /> Activate</DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => runAction(u, "logout")}><LogOut /> Force logout</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => runAction(u, "reset")}><KeyRound /> Reset password</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [runAction]
  );

  const meta = data?.meta;

  return (
    <>
      <AdminPageHeader
        title="User Management"
        description="Every user who signed up on the platform. Suspend, reset passwords, and manage sessions."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
        actions={meta && <span className="text-sm text-muted-foreground">{meta.total} users</span>}
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        loading={isLoading}
        emptyMessage="No users match your filters."
        pagination={meta ? { page: meta.page, pageCount: meta.pageCount, total: meta.total } : undefined}
        onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
        toolbar={
          <div className="flex w-full flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, email, organization..." className="pl-9" />
            </div>
            <select
              value={query.status ?? ""}
              onChange={(e) => setQuery((q) => ({ ...q, status: e.target.value || undefined, page: 1 }))}
              className="h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s ? s : "All statuses"}</option>)}
            </select>
            {(query.status || query.search) && (
              <Button variant="outline" size="sm" onClick={() => { setQuery({ page: 1, pageSize: 20 }); setSearchInput(""); }}>
                <UsersIcon className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        }
      />

      <UserDialog
        userId={dialog?.id ?? null}
        editMode={dialog?.editMode ?? false}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
