"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileText, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatBytes, timeAgo } from "@/lib/format";
import {
  useTrash,
  useRestoreDocument,
  usePermanentlyDeleteDocument,
  type TrashedDocument,
} from "@/hooks/use-trash";

function TrashRow({ doc }: { doc: TrashedDocument }) {
  const restore = useRestoreDocument();
  const purge = usePermanentlyDeleteDocument();
  const confirm = useConfirm();

  function onRestore() {
    restore.mutate(doc.id, {
      onSuccess: () => toast.success(`"${doc.title}" restored.`),
      onError: () => toast.error("Couldn't restore document."),
    });
  }

  async function onPurge() {
    const ok = await confirm({
      title: `Permanently delete "${doc.title}"?`,
      description:
        "This can't be undone. The file, extracted text, chunks, embeddings and AI results will be removed for good.",
      confirmLabel: "Delete forever",
      tone: "danger",
    });
    if (!ok) return;
    purge.mutate(doc.id, {
      onSuccess: () => toast.success(`"${doc.title}" permanently deleted.`),
      onError: () => toast.error("Couldn't delete document."),
    });
  }

  const busy = restore.isPending || purge.isPending;

  return (
    <tr className="border-b border-border/60 last:border-0 hover:bg-muted/60">
      <td className="py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
          </span>
          <span className="truncate font-medium text-foreground">{doc.title}</span>
        </div>
      </td>
      <td className="py-2.5 text-muted-foreground">
        {doc.sizeBytes ? formatBytes(doc.sizeBytes) : "—"}
      </td>
      <td className="py-2.5 text-muted-foreground">{timeAgo(doc.deletedAt)}</td>
      <td className="py-2.5">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onRestore}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
          >
            {restore.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Restore
          </button>

          <button
            onClick={onPurge}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-[12px] font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
          >
            {purge.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete forever
          </button>
        </div>
      </td>
    </tr>
  );
}

/** Trash view: restore or permanently delete soft-deleted documents. */
export function TrashManager() {
  const { data, isLoading, isError } = useTrash();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-[13px] text-red-600 dark:text-red-400">
        Couldn&apos;t load Trash. Please refresh.
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Trash2}
        title="Trash is empty"
        description="Documents you delete are kept here so you can restore them or remove them permanently."
      />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] font-medium text-muted-foreground">
              <th className="pb-2.5 font-medium">Document Name</th>
              <th className="pb-2.5 font-medium">Size</th>
              <th className="pb-2.5 font-medium">Deleted</th>
              <th className="pb-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((doc) => (
              <TrashRow key={doc.id} doc={doc} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
