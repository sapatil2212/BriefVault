"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ClipboardList,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Briefcase,
  ShieldCheck,
  Scale,
  Search,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CustomSelect } from "@/components/ui/custom-select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { timeAgo } from "@/lib/format";
import { useDocuments } from "@/hooks/use-documents";
import {
  useReports,
  useGenerateReport,
  useDeleteReport,
  type ReportType,
  type ReportListItem,
} from "@/hooks/use-reports";

interface TypeMeta {
  value: ReportType;
  label: string;
  icon: LucideIcon;
  desc: string;
  tone: string;
}

const TYPES: TypeMeta[] = [
  { value: "EXECUTIVE", label: "Executive", icon: Sparkles, desc: "High-level summary for leadership", tone: "text-violet-500" },
  { value: "CLIENT", label: "Client", icon: Briefcase, desc: "Plain-language client update", tone: "text-blue-500" },
  { value: "COMPLIANCE", label: "Compliance", icon: ShieldCheck, desc: "Obligations & applicable provisions", tone: "text-emerald-500" },
  { value: "LEGAL_OPINION", label: "Legal Opinion", icon: Scale, desc: "Facts, issue, analysis, conclusion", tone: "text-amber-500" },
];

const typeByValue = new Map(TYPES.map((t) => [t.value, t]));

/** Reports workspace: generate from a processed document, then browse/open. */
export function ReportsManager() {
  const router = useRouter();
  const { data: reports, isLoading } = useReports();
  const { data: documents } = useDocuments();
  const generate = useGenerateReport();
  const remove = useDeleteReport();
  const confirm = useConfirm();

  const readyDocs = (documents ?? []).filter((d) => d.status === "READY");
  const [docId, setDocId] = React.useState("");
  const [type, setType] = React.useState<ReportType>("EXECUTIVE");
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ReportType | "all">("all");

  const q = query.trim().toLowerCase();
  const filtered = React.useMemo(() => {
    return (reports ?? []).filter((r) => {
      if (filter !== "all" && r.type !== filter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.documentTitle.toLowerCase().includes(q)
      );
    });
  }, [reports, filter, q]);

  async function onGenerate() {
    if (!docId) {
      toast.error("Select a document first.");
      return;
    }
    const p = generate.mutateAsync({ documentId: docId, type });
    toast.promise(p, {
      loading: "Generating report…",
      success: "Report generated.",
      error: (e) => (e instanceof Error ? e.message : "Failed to generate."),
    });
    try {
      const res = await p;
      router.push(`/dashboard/reports/${res.id}`);
    } catch {
      /* toast already surfaced the error */
    }
  }

  async function onDelete(id: string, title: string) {
    const ok = await confirm({
      title: `Delete "${title}"?`,
      description: "This permanently deletes the generated report.",
      confirmLabel: "Delete report",
      tone: "danger",
    });
    if (!ok) return;
    toast.promise(remove.mutateAsync(id), {
      loading: "Deleting…",
      success: "Report deleted.",
      error: "Failed to delete.",
    });
  }

  return (
    <div className="space-y-5">
      {/* Generator */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[13px] font-semibold text-foreground">Generate a Report</h2>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Source document
              </label>
              {readyDocs.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">
                  No processed documents yet.{" "}
                  <Link href="/dashboard/upload" className="font-medium text-violet-500 hover:underline">
                    Upload one
                  </Link>
                  .
                </p>
              ) : (
                <CustomSelect
                  value={docId}
                  onChange={setDocId}
                  options={[
                    { value: "", label: "Select a document…", icon: <FileText className="h-4 w-4 text-muted-foreground" /> },
                    ...readyDocs.map((d) => ({
                      value: d.id,
                      label: d.title,
                      icon: <FileText className="h-4 w-4 text-violet-500" />,
                    })),
                  ]}
                  placeholder="Choose a document"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Report type
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = type === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition",
                        active
                          ? "border-violet-500/50 bg-muted/60 ring-1 ring-violet-500/20"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", active ? t.tone : "text-muted-foreground")} />
                      <span className="text-[12px] font-semibold text-foreground">{t.label}</span>
                      <span className="text-[10px] leading-tight text-muted-foreground">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={generate.isPending || readyDocs.length === 0}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60 lg:w-40"
          >
            {generate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ClipboardList className="h-4 w-4" />
            )}
            Generate
          </button>
        </div>
      </section>

      {/* List header: count + search + type filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-semibold text-foreground">Your Reports</h2>
          {reports && reports.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {reports.length}
            </span>
          )}
        </div>
        {reports && reports.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports..."
              className="h-9 w-full rounded-lg border border-border bg-muted pl-8 pr-3 text-[13px] text-foreground outline-none transition focus:border-violet-400 focus:bg-card focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        )}
      </div>

      {reports && reports.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {TYPES.map((t) => (
            <FilterChip key={t.value} active={filter === t.value} onClick={() => setFilter(t.value)}>
              {t.label}
            </FilterChip>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !reports || reports.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No reports yet"
          description="Generate your first report from a processed document above."
        />
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-[13px] text-muted-foreground">
          No reports match your filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((r) => (
            <ReportCard key={r.id} report={r} onDelete={() => onDelete(r.id, r.title)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, onDelete }: { report: ReportListItem; onDelete: () => void }) {
  const meta = typeByValue.get(report.type);
  const Icon = meta?.icon ?? ClipboardList;
  return (
    <div className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition hover:border-violet-500/30 hover:shadow-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className={cn("h-4 w-4", meta?.tone)} />
      </span>

      <div className="min-w-0 flex-1">
        <Link
          href={`/dashboard/reports/${report.id}`}
          className="line-clamp-1 text-[13px] font-semibold text-foreground transition hover:text-violet-500"
        >
          {report.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span className="rounded border border-border px-1.5 py-0.5 font-medium">
            {meta?.label ?? report.type}
          </span>
          <span className="inline-flex items-center gap-1 truncate">
            <FileText className="h-3 w-3 shrink-0" />
            <span className="truncate">{report.documentTitle}</span>
          </span>
          {report.provider && <span className="capitalize">· {report.provider}</span>}
          <span>· {timeAgo(report.createdAt)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/dashboard/reports/${report.id}`}
          title="Open"
          aria-label="Open report"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={onDelete}
          title="Delete"
          aria-label="Delete report"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1 text-[12px] font-medium transition",
        active
          ? "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-400"
          : "border-border bg-card text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
