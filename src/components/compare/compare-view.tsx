"use client";

import * as React from "react";
import Link from "next/link";
import { GitCompare, Loader2, ArrowRight, Plus, Minus, Pencil, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/hooks/use-documents";
import { useCompare, type DiffSegment } from "@/hooks/use-compare";
import { CustomSelect } from "@/components/ui/custom-select";

/** Document comparison workspace: pick two documents, view classified diff. */
export function CompareView() {
  const { data: documents } = useDocuments();
  const compare = useCompare();
  const readyDocs = (documents ?? []).filter((d) => d.status === "READY");

  const [aId, setAId] = React.useState("");
  const [bId, setBId] = React.useState("");
  const [onlyChanges, setOnlyChanges] = React.useState(false);

  const data = compare.data;

  const segments = React.useMemo(() => {
    if (!data) return [];
    return onlyChanges
      ? data.result.segments.filter((s) => s.type !== "equal")
      : data.result.segments;
  }, [data, onlyChanges]);

  return (
    <div className="space-y-5">
      {/* Selector */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
          <DocSelect label="Document A" value={aId} onChange={setAId} options={readyDocs} exclude={bId} />
          <div className="hidden pb-2 sm:block">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <DocSelect label="Document B" value={bId} onChange={setBId} options={readyDocs} exclude={aId} />
          <button
            onClick={() => aId && bId && compare.mutate({ documentAId: aId, documentBId: bId })}
            disabled={!aId || !bId || compare.isPending}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {compare.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
            Compare
          </button>
        </div>

        {readyDocs.length < 2 && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            You need at least two processed documents.{" "}
            <Link href="/dashboard/upload" className="font-medium text-violet-500 hover:underline">
              Upload more
            </Link>
            .
          </p>
        )}
        {compare.isError && (
          <p className="mt-3 text-[13px] text-red-600 dark:text-red-400">
            {compare.error instanceof Error ? compare.error.message : "Comparison failed."}
          </p>
        )}
      </div>

      {/* Results */}
      {data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Similarity" value={`${Math.round(data.result.similarity * 100)}%`} tone="violet" />
            <Stat label="Added" value={String(data.result.stats.added)} tone="emerald" icon={Plus} />
            <Stat label="Removed" value={String(data.result.stats.removed)} tone="red" icon={Minus} />
            <Stat label="Modified" value={String(data.result.stats.modified)} tone="amber" icon={Pencil} />
          </div>

          {/* Header + toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span className="font-medium text-foreground">{data.documentA.title}</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{data.documentB.title}</span>
            </div>
            <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <input
                type="checkbox"
                checked={onlyChanges}
                onChange={(e) => setOnlyChanges(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-violet-600"
              />
              Show only changes
            </label>
          </div>

          {/* Diff */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-2 border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="border-r border-border px-4 py-2">Before — {data.documentA.title}</div>
              <div className="px-4 py-2">After — {data.documentB.title}</div>
            </div>
            <div className="max-h-[600px] divide-y divide-border overflow-y-auto">
              {segments.length === 0 ? (
                <p className="p-6 text-center text-[13px] text-muted-foreground">
                  {onlyChanges ? "No differences found." : "Documents are identical."}
                </p>
              ) : (
                segments.map((seg, i) => <DiffRow key={i} seg={seg} />)
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DocSelect({
  label,
  value,
  onChange,
  options,
  exclude,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; title: string }[];
  exclude: string;
}) {
  const filteredOptions = options
    .filter((o) => o.id !== exclude)
    .map((o) => ({
      value: o.id,
      label: o.title,
      icon: <FileText className="h-4 w-4 text-violet-500" />,
    }));

  return (
    <CustomSelect
      label={label}
      value={value}
      onChange={onChange}
      options={[
        { value: "", label: "Select…", icon: <FileText className="h-4 w-4 text-muted-foreground" /> },
        ...filteredOptions,
      ]}
      placeholder="Select a document"
    />
  );
}

const statTones: Record<string, string> = {
  violet: "bg-violet-500/10 text-violet-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  red: "bg-red-500/10 text-red-500",
  amber: "bg-amber-500/10 text-amber-500",
};

function Stat({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: string;
  icon?: typeof Plus;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", statTones[tone])}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function DiffRow({ seg }: { seg: DiffSegment }) {
  const leftTone =
    seg.type === "removed" || seg.type === "modified"
      ? "bg-red-500/10 text-red-700 dark:text-red-300"
      : seg.type === "equal"
        ? "text-muted-foreground"
        : "text-transparent";
  const rightTone =
    seg.type === "added" || seg.type === "modified"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : seg.type === "equal"
        ? "text-muted-foreground"
        : "text-transparent";

  return (
    <div className="grid grid-cols-2 text-[13px] leading-relaxed">
      <div className={cn("border-r border-border px-4 py-2", leftTone)}>
        {seg.before ?? "—"}
      </div>
      <div className={cn("px-4 py-2", rightTone)}>{seg.after ?? "—"}</div>
    </div>
  );
}
