"use client";

import { cn } from "@/lib/utils";
import type { AnalysisRender } from "@/lib/ai/analysis/catalog";

/** Render an analysis payload generically based on its render shape. */
export function AnalysisResultBody({
  render,
  payload,
}: {
  render: AnalysisRender;
  payload: unknown;
}) {
  if (render === "sections") return <Sections payload={payload} />;
  if (render === "risk") return <Risks payload={payload} />;
  if (render === "checklist") return <Checklist payload={payload} />;
  return <List payload={payload} />;
}

function empty(msg = "No content was extracted.") {
  return <p className="text-[13px] text-muted-foreground">{msg}</p>;
}

/** Small "p.X ¶Y" citation badge shown when a location is known. */
function CiteBadge({ page, paragraph }: { page?: number | null; paragraph?: number | null }) {
  if (page == null && paragraph == null) return null;
  return (
    <span className="inline-flex shrink-0 items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border">
      {page != null ? `p.${page}` : ""}
      {page != null && paragraph != null ? " " : ""}
      {paragraph != null ? `¶${paragraph}` : ""}
    </span>
  );
}

function Sections({ payload }: { payload: unknown }) {
  const sections =
    (payload as {
      sections?: { heading: string; body: string | null; page?: number | null; paragraph?: number | null }[];
    })?.sections ?? [];
  const filled = sections.filter((s) => s.body && s.body.trim());
  if (filled.length === 0) return empty();
  return (
    <div className="space-y-3">
      {filled.map((s, i) => (
        <div key={i}>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {s.heading}
            </p>
            <CiteBadge page={s.page} paragraph={s.paragraph} />
          </div>
          <p className="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-foreground">
            {s.body}
          </p>
        </div>
      ))}
    </div>
  );
}

function List({ payload }: { payload: unknown }) {
  const items =
    (payload as {
      items?: {
        title: string;
        detail?: string | null;
        tag?: string | null;
        page?: number | null;
        paragraph?: number | null;
      }[];
    })?.items ?? [];
  if (items.length === 0) return empty();
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 rounded-lg bg-muted/60 px-3 py-2">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-medium text-foreground">{it.title}</span>
              {it.tag && (
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-500">
                  {it.tag}
                </span>
              )}
              <span className="ml-auto">
                <CiteBadge page={it.page} paragraph={it.paragraph} />
              </span>
            </div>
            {it.detail && (
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{it.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

const riskTone: Record<string, string> = {
  Low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  High: "bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20",
};

function Risks({ payload }: { payload: unknown }) {
  const risks =
    (payload as { risks?: { category: string; level: string; reasoning: string }[] })?.risks ?? [];
  if (risks.length === 0) return empty("No risks identified.");
  return (
    <div className="space-y-2.5">
      {risks.map((r, i) => (
        <div key={i} className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-foreground">{r.category}</span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                riskTone[r.level] ?? "bg-muted text-muted-foreground ring-border"
              )}
            >
              {r.level}
            </span>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{r.reasoning}</p>
        </div>
      ))}
    </div>
  );
}

function Checklist({ payload }: { payload: unknown }) {
  const items = (payload as { items?: { label: string; done: boolean }[] })?.items ?? [];
  if (items.length === 0) return empty("No checklist items found.");
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px]">
          <span
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
              it.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"
            )}
          >
            {it.done ? "✓" : ""}
          </span>
          <span className="text-foreground">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
