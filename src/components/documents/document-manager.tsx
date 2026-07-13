"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  FileText,
  LayoutGrid,
  List,
  Search,
  Trash2,
  UploadCloud,
  Loader2,
  Eye,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { FolderSelectDialog, type FolderOption } from "@/components/ui/folder-select-dialog";
import { formatBytes, timeAgo } from "@/lib/format";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
  type DocumentListItem,
} from "@/hooks/use-documents";

type View = "grid" | "list";

/**
 * Full document manager: drag-and-drop upload, live grid/list views, search,
 * and delete — all wired to the real document APIs via TanStack Query.
 * Includes folder selection dialog before uploading.
 */
export function DocumentManager() {
  const router = useRouter();
  const { data, isLoading, isError } = useDocuments();
  const upload = useUploadDocument();
  const remove = useDeleteDocument();
  const confirm = useConfirm();

  const [view, setView] = React.useState<View>("grid");
  const [query, setQuery] = React.useState("");
  const [showFolderDialog, setShowFolderDialog] = React.useState(false);
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [folders, setFolders] = React.useState<FolderOption[]>([]);

  // Fetch folders on mount
  React.useEffect(() => {
    async function fetchFolders() {
      try {
        const res = await fetch("/api/folders");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setFolders(json.data);
          }
        }
      } catch {
        // Silent fail - folders are optional
      }
    }
    fetchFolders();
  }, []);

  const handleFolderSelect = React.useCallback(
    (folderId: string | null) => {
      // Upload pending files with selected folder
      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append("file", file);
        if (folderId) formData.append("folderId", folderId);

        toast.promise(
          fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          }).then(async (res) => {
            if (!res.ok) throw new Error("Upload failed");
            return res.json();
          }),
          {
            loading: `Uploading ${file.name}…`,
            success: `${file.name} uploaded.`,
            error: (e) => (e instanceof Error ? e.message : "Upload failed."),
          }
        );
      }
      setPendingFiles([]);
    },
    [pendingFiles]
  );

  const onDrop = React.useCallback(
    (files: File[]) => {
      // Show folder selection dialog before uploading
      setPendingFiles(files);
      setShowFolderDialog(true);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const filtered = React.useMemo(() => {
    const items = data ?? [];
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.court ?? "").toLowerCase().includes(q) ||
        (d.caseNumber ?? "").toLowerCase().includes(q)
    );
  }, [data, query]);

  async function onDelete(id: string, title: string) {
    const ok = await confirm({
      title: `Delete "${title}"?`,
      description: "This moves it to Trash. You can restore it later.",
      confirmLabel: "Move to Trash",
      tone: "danger",
    });
    if (!ok) return;
    toast.promise(remove.mutateAsync(id), {
      loading: "Deleting…",
      success: "Document deleted.",
      error: "Failed to delete.",
    });
  }

  return (
    <div {...getRootProps()} className="relative space-y-4">
      <input {...getInputProps()} />

      {/* Folder Selection Dialog */}
      <FolderSelectDialog
        open={showFolderDialog}
        onClose={() => {
          setShowFolderDialog(false);
          setPendingFiles([]);
        }}
        onSelect={handleFolderSelect}
        folders={folders}
        onCreateFolder={() => router.push("/dashboard/folders")}
      />

      {/* Drag overlay */}
      {isDragActive && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-violet-400 bg-violet-50/90">
          <div className="text-center">
            <UploadCloud className="mx-auto h-8 w-8 text-violet-600" />
            <p className="mt-2 text-[14px] font-semibold text-violet-700">
              Drop files to upload
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="h-9 w-64 rounded-lg border border-border bg-muted pl-9 pr-3 text-[13px] text-foreground outline-none transition focus:border-violet-400 focus:bg-card focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition",
                view === "grid" ? "bg-violet-600 text-white" : "text-muted-foreground hover:bg-muted"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition",
                view === "list" ? "bg-violet-600 text-white" : "text-muted-foreground hover:bg-muted"
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={open}
            disabled={upload.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {upload.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UploadCloud className="h-3.5 w-3.5" />
            )}
            Upload
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={view === "grid" ? "grid grid-cols-2 gap-4 lg:grid-cols-3" : "space-y-2"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={view === "grid" ? "h-32" : "h-14"} />
          ))}
        </div>
      ) : isError ? (
        <p className="text-[13px] text-red-600 dark:text-red-400">Couldn&apos;t load documents.</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={query ? "No matching documents" : "No documents yet"}
          description={
            query
              ? "Try a different search term."
              : "Drag & drop a file here, or use the Upload button."
          }
          action={
            !query ? (
              <button
                onClick={open}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Upload Document
              </button>
            ) : undefined
          }
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {filtered.map((doc) => (
            <GridCard key={doc.id} doc={doc} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <ListTable docs={filtered} onDelete={onDelete} />
      )}
    </div>
  );
}

function GridCard({
  doc,
  onDelete,
}: {
  doc: DocumentListItem;
  onDelete: (id: string, title: string) => void;
}) {
  return (
    <div className="group relative rounded-xl border border-border bg-card p-4 transition hover:border-violet-500/40 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
          <FileText className="h-4 w-4" />
        </span>
        <StatusBadge status={doc.status} />
      </div>
      <Link
        href={`/dashboard/documents/${doc.id}`}
        className="mt-3 line-clamp-2 block text-[13px] font-semibold text-foreground hover:text-violet-500"
      >
        {doc.title}
      </Link>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {doc.court || doc.caseNumber || doc.kind} · {formatBytes(doc.sizeBytes ?? 0)}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
        <span className="text-[11px] text-muted-foreground">{timeAgo(doc.createdAt)}</span>
        <div className="flex items-center gap-1">
          <Link
            href={`/dashboard/documents/${doc.id}`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="View"
          >
            <Eye className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/dashboard/documents/${doc.id}`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open document"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => onDelete(doc.id, doc.title)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ListTable({
  docs,
  onDelete,
}: {
  docs: DocumentListItem[];
  onDelete: (id: string, title: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-medium text-muted-foreground">
            <th className="px-4 py-3 font-medium">Document</th>
            <th className="px-4 py-3 font-medium">Court / Case</th>
            <th className="px-4 py-3 font-medium">Size</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Uploaded</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => (
            <tr key={doc.id} className="border-b border-border/60 last:border-0 hover:bg-muted/60">
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="flex items-center gap-2.5 font-medium text-foreground hover:text-violet-500"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  {doc.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{doc.court || doc.caseNumber || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatBytes(doc.sizeBytes ?? 0)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={doc.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{timeAgo(doc.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/dashboard/documents/${doc.id}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/dashboard/documents/${doc.id}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Open document"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => onDelete(doc.id, doc.title)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
