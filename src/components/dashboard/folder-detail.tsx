"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, ArrowLeft, Plus, X, Loader2, FolderOpen } from "lucide-react";
import { apiSend } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/format";

interface FolderDoc {
  id: string;
  title: string;
  status: string;
  resultCount: number;
  createdAt: string;
}

interface PickerDoc {
  id: string;
  title: string;
  folderId: string | null;
  status: string;
}

export function FolderDetail({
  folderId,
  folderName,
  documents,
  candidates,
}: {
  folderId: string;
  folderName: string;
  documents: FolderDoc[];
  candidates: PickerDoc[];
}) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function move(documentId: string, target: string | null, label: string) {
    setPendingId(documentId);
    try {
      await apiSend(`/api/documents/${documentId}`, "PATCH", { folderId: target });
      toast.success(label);
      router.refresh();
    } catch {
      toast.error("Couldn't move document.");
    } finally {
      setPendingId(null);
    }
  }

  const available = candidates.filter((c) => c.folderId !== folderId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/folders"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All folders
          </Link>
          <h1 className="mt-1 text-xl font-bold text-foreground">{folderName}</h1>
          <p className="text-[13px] text-muted-foreground">
            {documents.length} document{documents.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={() => setAdding((a) => !a)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Add documents
        </button>
      </div>

      {adding && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2.5 text-[13px] font-semibold text-foreground">
            Add documents to this folder
          </p>
          {available.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              All your documents are already in this folder.
            </p>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto">
              {available.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                    {c.title}
                  </span>
                  {c.folderId && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      in another folder
                    </span>
                  )}
                  <button
                    onClick={() => move(c.id, folderId, `Added "${c.title}".`)}
                    disabled={pendingId === c.id}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-600 transition hover:bg-violet-500/20 disabled:opacity-60 dark:text-violet-400"
                  >
                    {pendingId === c.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {documents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="This folder is empty"
          description="Use “Add documents” to move documents into this folder."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium text-muted-foreground">
                  <th className="pb-2.5 font-medium">Document Name</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium">Insights</th>
                  <th className="pb-2.5 font-medium">Added</th>
                  <th className="pb-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className={cn(
                      "border-b border-border/60 last:border-0 hover:bg-muted/60"
                    )}
                  >
                    <td className="py-2.5">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="flex items-center gap-2 font-medium text-foreground hover:text-violet-500"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{doc.title}</span>
                      </Link>
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-2.5 text-muted-foreground">{doc.resultCount}</td>
                    <td className="py-2.5 text-muted-foreground">{timeAgo(doc.createdAt)}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => move(doc.id, null, `Removed "${doc.title}".`)}
                        disabled={pendingId === doc.id}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-60"
                      >
                        {pendingId === doc.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
