"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Upload, FileText, Loader2, CheckCircle2, AlertCircle,
  Sparkles, Folder, Lock, ArrowUpRight, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/custom-select";

type Mode = "text" | "file";

interface ApiResult {
  success: boolean;
  message: string;
  data?: { id: string; status: string; title: string } | null;
}

interface FolderItem {
  id: string;
  name: string;
  color: string | null;
}

interface PlanLimits {
  documentsPerMonth: number;
  pagesPerDocument: number;
  aiQuestions: number;
  storageMb: number;
}

interface SubOverview {
  plan: { key: string; name: string } | null;
  status: string | null;
  limits: PlanLimits | null;
  usage: { documentsThisMonth: number; storageBytes: number };
}

/**
 * Upload panel supporting two flows:
 *  - Paste text  → POST /api/documents/process (JSON)
 *  - Upload file → POST /api/documents/upload (multipart)
 * Both are processed asynchronously by the durable queue worker.
 */
export function UploadDocument() {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("text");
  const [title, setTitle] = React.useState("");
  const [text, setText] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [folderId, setFolderId] = React.useState<string>("");
  const [folders, setFolders] = React.useState<FolderItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<ApiResult["data"] | null>(null);
  const [sub, setSub] = React.useState<SubOverview | null>(null);
  const [loadingSub, setLoadingSub] = React.useState(true);

  // Fetch folders & subscription on mount
  React.useEffect(() => {
    async function fetchAll() {
      await Promise.all([
        fetch("/api/folders")
          .then((r) => r.ok ? r.json() : null)
          .then((json) => {
            if (json?.success && Array.isArray(json.data)) setFolders(json.data);
          })
          .catch(() => {}),
        fetch("/api/subscription/me")
          .then((r) => r.ok ? r.json() : null)
          .then((json) => {
            if (json?.success) setSub(json.data as SubOverview);
          })
          .catch(() => {})
          .finally(() => setLoadingSub(false)),
      ]);
    }
    fetchAll();
  }, []);

  // Derived limit state
  const docsUsed = sub?.usage?.documentsThisMonth ?? 0;
  const docsLimit = sub?.limits?.documentsPerMonth ?? 0;
  const storageLimitBytes = (sub?.limits?.storageMb ?? 0) * 1024 * 1024;
  const storageUsed = sub?.usage?.storageBytes ?? 0;
  const fileSizeForCheck = mode === "file" ? (file?.size ?? 0) : 0;

  const docLimitReached = docsLimit > 0 && docsUsed >= docsLimit;
  const storageWillExceed =
    storageLimitBytes > 0 && (storageUsed + fileSizeForCheck) > storageLimitBytes;
  const isBlocked = sub !== null && (docLimitReached || storageWillExceed);

  const reset = () => {
    setError(null);
    setDone(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setBusy(true);
    try {
      let res: Response;
      if (mode === "file") {
        if (!file) {
          setError("Please choose a file to upload.");
          setBusy(false);
          return;
        }
        const form = new FormData();
        form.append("file", file);
        if (title.trim()) form.append("title", title.trim());
        if (folderId) form.append("folderId", folderId);
        res = await fetch("/api/documents/upload", { method: "POST", body: form });
      } else {
        if (!text.trim() || !title.trim()) {
          setError("A title and document text are both required.");
          setBusy(false);
          return;
        }
        res = await fetch("/api/documents/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            text,
            folderId: folderId || null,
          }),
        });
      }

      const json: ApiResult = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Upload failed. Please try again.");
        return;
      }
      setDone(json.data ?? null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-[15px] font-semibold">Upload received</span>
        </div>
        <p className="mt-2 text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">{done.title}</span> is
          being processed in the background. It&apos;ll appear in My Documents and
          flip to <span className="font-medium text-foreground">Ready</span> when
          analysis completes — no need to wait here.
        </p>
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={() => router.push(`/dashboard/documents/${done.id}`)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-violet-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            View document
          </button>
          <button
            onClick={() => {
              setTitle("");
              setText("");
              setFile(null);
              setFolderId("");
              reset();
            }}
            className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition hover:bg-muted"
          >
            Upload another
          </button>
        </div>
      </div>
    );
  }

  // Plan limit gate
  if (!loadingSub && isBlocked) {
    const planName = sub?.plan?.name ?? "your current plan";
    const reason = docLimitReached
      ? `You've used ${docsUsed} of ${docsLimit} document${docsLimit === 1 ? "" : "s"} this month.`
      : `Your storage is at capacity.`;
    const docsPercent = docsLimit > 0 ? Math.min(100, (docsUsed / docsLimit) * 100) : 0;
    const storagePercent =
      storageLimitBytes > 0
        ? Math.min(100, (storageUsed / storageLimitBytes) * 100)
        : 0;

    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
            <Lock className="h-5 w-5 text-amber-500" />
          </span>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-foreground">
              Plan limit reached
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {reason} Upgrade your plan to continue uploading documents.
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground/70">
              Current plan: <span className="font-medium text-foreground">{planName}</span>
            </p>
          </div>
        </div>

        {/* Usage bars */}
        <div className="mt-5 space-y-3">
          {docsLimit > 0 && (
            <div>
              <div className="mb-1.5 flex justify-between text-[12px]">
                <span className="text-muted-foreground">Documents this month</span>
                <span className={cn("font-medium", docLimitReached ? "text-red-500" : "text-foreground")}>
                  {docsUsed} / {docsLimit}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    docsPercent >= 100 ? "bg-red-500" : "bg-violet-500"
                  )}
                  style={{ width: `${docsPercent}%` }}
                />
              </div>
            </div>
          )}
          {storageLimitBytes > 0 && (
            <div>
              <div className="mb-1.5 flex justify-between text-[12px]">
                <span className="text-muted-foreground">Storage used</span>
                <span className={cn("font-medium", storagePercent >= 100 ? "text-red-500" : "text-foreground")}>
                  {(storageUsed / (1024 * 1024)).toFixed(1)} MB / {sub!.limits!.storageMb} MB
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    storagePercent >= 100 ? "bg-red-500" : "bg-violet-500"
                  )}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            onClick={() => router.push("/dashboard/subscription")}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-violet-700"
          >
            <ArrowUpRight className="h-4 w-4" />
            Upgrade plan
          </button>
          <button
            onClick={() => router.push("/dashboard/documents")}
            className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition hover:bg-muted"
          >
            View my documents
          </button>
        </div>
      </div>
    );
  }

  // Storage warning (approaching limit but not yet exceeded)
  const storageWarning =
    !isBlocked &&
    storageLimitBytes > 0 &&
    storageUsed / storageLimitBytes > 0.8;

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6">
      {/* Plan usage summary bar */}
      {!loadingSub && sub && docsLimit > 0 && (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-[12px]">
          <span className="text-muted-foreground">
            Documents this month:&nbsp;
            <span className={cn("font-semibold", docsUsed >= docsLimit ? "text-red-500" : "text-foreground")}>
              {docsUsed} / {docsLimit}
            </span>
          </span>
          {sub?.limits?.storageMb && sub.limits.storageMb > 0 && (
            <span className="text-muted-foreground">
              Storage:&nbsp;
              <span className="font-semibold text-foreground">
                {(storageUsed / (1024 * 1024)).toFixed(1)} / {sub.limits.storageMb} MB
              </span>
            </span>
          )}
        </div>
      )}

      {storageWarning && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Storage is over 80% full. Consider upgrading your plan.</span>
        </div>
      )}

      {/* Mode toggle */}
      <div className="mb-5 inline-flex rounded-lg border border-border p-0.5">
        {(["text", "file"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              reset();
            }}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-[13px] font-medium transition",
              mode === m
                ? "bg-violet-600 text-white"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {m === "text" ? "Paste text" : "Upload file"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Document title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The Right to Information Act, 2005"
            className="h-9 w-full rounded-lg border border-border bg-muted px-3 text-[13px] text-foreground outline-none transition focus:border-violet-400 focus:bg-card focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        {/* Folder Selection */}
        {folders.length > 0 && (
          <div>
            <CustomSelect
              label={
                <span className="flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5" />
                  Folder (optional)
                </span>
              }
              value={folderId}
              onChange={setFolderId}
              options={[
                { value: "", label: "No folder", icon: <Folder className="h-4 w-4 text-muted-foreground" /> },
                ...folders.map((folder) => ({
                  value: folder.id,
                  label: folder.name,
                  icon: <Folder className="h-4 w-4 text-violet-500" />,
                })),
              ]}
              placeholder="Select a folder"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Select a folder to organize this document, or{" "}
              <button
                type="button"
                onClick={() => router.push("/dashboard/folders")}
                className="text-violet-600 hover:underline dark:text-violet-400"
              >
                create a new folder
              </button>
            </p>
          </div>
        )}

        {mode === "text" ? (
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Document text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="Paste the full document text here…"
              className="w-full resize-y rounded-lg border border-border bg-muted p-3 text-[13px] leading-relaxed text-foreground outline-none transition focus:border-violet-400 focus:bg-card focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/50 p-8 text-center transition hover:border-violet-500/40 hover:bg-violet-500/5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              {file ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            </span>
            <span className="text-[13px] font-medium text-foreground">
              {file ? file.name : "Click to choose a file"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              PDF, DOCX, TXT, and images (PNG/JPG/TIFF via OCR) are processed.
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <span>{error}</span>
              {error.toLowerCase().includes("limit") && (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/subscription")}
                  className="ml-2 text-violet-600 underline hover:no-underline dark:text-violet-400"
                >
                  Upgrade plan →
                </button>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload &amp; Analyze
            </>
          )}
        </button>
      </div>
    </form>
  );
}
