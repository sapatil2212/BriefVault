"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  FileText,
  Eye,
  Pencil,
  Download,
  Trash2,
  X,
  Check,
  Loader2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiSend } from "@/lib/api/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatBytes } from "@/lib/format";
import { PdfPanel } from "@/components/documents/pdf-panel";
import type { ViewerCitation } from "@/components/documents/pdf-viewer";

interface DocumentHeaderProps {
  documentId: string;
  title: string;
  status: string;
  kind: string;
  language?: string | null;
  pageCount?: number | null;
  sizeBytes?: number | null;
  readingTimeSaved?: number | null;
  pdfUrl?: string | null;
  citations?: ViewerCitation[];
}

/** Small, neutral icon action with a native tooltip. */
function IconAction({
  label,
  onClick,
  href,
  danger,
  children,
  disabled,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const cls = cn(
    "flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted disabled:opacity-50",
    danger && "hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
  );
  if (href) {
    return (
      <a href={href} download title={label} aria-label={label} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label} className={cls}>
      {children}
    </button>
  );
}

/**
 * Compact, neutral document header: identity + metadata chips and icon-only
 * actions (view / rename / download / delete). The source file opens in a modal
 * on view rather than rendering inline.
 */
export function DocumentHeader({
  documentId,
  title,
  status,
  kind,
  language,
  pageCount,
  sizeBytes,
  readingTimeSaved,
  pdfUrl,
  citations = [],
}: DocumentHeaderProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [viewing, setViewing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(title);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setName(title), [title]);

  // Auto-refresh while the document is still processing so the page updates to
  // Ready on its own. Bounded so it never polls indefinitely.
  React.useEffect(() => {
    if (status !== "PROCESSING" && status !== "UPLOADED") return;
    let ticks = 0;
    const timer = setInterval(() => {
      ticks += 1;
      if (ticks > 150) {
        clearInterval(timer);
        return;
      }
      router.refresh();
    }, 4_000);
    return () => clearInterval(timer);
  }, [status, router]);

  React.useEffect(() => {
    if (!viewing) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setViewing(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [viewing]);

  async function saveName() {
    const next = name.trim();
    if (!next || next === title) {
      setEditing(false);
      setName(title);
      return;
    }
    setSaving(true);
    try {
      await apiSend(`/api/documents/${documentId}`, "PATCH", { title: next });
      toast.success("Renamed.");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Couldn't rename document.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    const ok = await confirm({
      title: `Delete "${title}"?`,
      description: "This moves it to Trash. You can restore it later.",
      confirmLabel: "Move to Trash",
      tone: "danger",
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await apiSend(`/api/documents/${documentId}`, "DELETE");
      toast.success("Document moved to Trash.");
      router.push("/dashboard/documents");
      router.refresh();
    } catch {
      toast.error("Failed to delete document.");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            {editing ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") {
                      setEditing(false);
                      setName(title);
                    }
                  }}
                  className="h-7 w-full max-w-md rounded-md border border-border bg-muted px-2 text-[13px] font-semibold text-foreground outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                />
                <button
                  onClick={saveName}
                  disabled={saving}
                  title="Save"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:bg-muted disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setName(title);
                  }}
                  title="Cancel"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <h1 className="truncate text-[14px] font-semibold text-foreground" title={title}>
                {title}
              </h1>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <StatusBadge status={status} />
              <span className="rounded bg-muted px-1.5 py-0.5 font-medium uppercase">{kind}</span>
              {language && <span className="capitalize">{language}</span>}
              {pageCount != null && <span>{pageCount}p</span>}
              {sizeBytes != null && <span>{formatBytes(sizeBytes)}</span>}
              {readingTimeSaved != null && readingTimeSaved > 0 && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Clock className="h-3 w-3" />~{readingTimeSaved}m saved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Icon-only actions */}
        <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
          {pdfUrl && (
            <IconAction label="View" onClick={() => setViewing(true)}>
              <Eye className="h-4 w-4" />
            </IconAction>
          )}
          {!editing && (
            <IconAction label="Rename" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </IconAction>
          )}
          {pdfUrl && (
            <IconAction label="Download" href={pdfUrl}>
              <Download className="h-4 w-4" />
            </IconAction>
          )}
          <IconAction label="Delete" onClick={onDelete} danger disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </IconAction>
        </div>
      </div>

      {/* PDF viewer modal */}
      <AnimatePresence>
        {viewing && pdfUrl && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setViewing(false)}
              aria-hidden
            />
            <motion.div
              className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", duration: 0.32, bounce: 0.2 }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-[13px] font-semibold text-foreground">{title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconAction label="Download" href={pdfUrl}>
                    <Download className="h-3.5 w-3.5" />
                  </IconAction>
                  <IconAction label="Close" onClick={() => setViewing(false)}>
                    <X className="h-4 w-4" />
                  </IconAction>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-muted/30 p-4">
                <PdfPanel fileUrl={pdfUrl} citations={citations} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
