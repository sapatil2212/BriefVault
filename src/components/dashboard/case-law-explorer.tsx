"use client";

import * as React from "react";
import Link from "next/link";
import { Scale, Search, Gavel, FileText, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export interface CaseCitation {
  documentId: string;
  documentTitle: string;
  title: string;
  detail: string | null;
  tag: string | null;
}

export interface JudgmentDoc {
  id: string;
  title: string;
  court: string | null;
  caseNumber: string | null;
  judge: string | null;
  decisionDate: string | null;
}

/** Searchable view of AI-extracted case citations + the user's judgment documents. */
export function CaseLawExplorer({
  citations,
  judgments,
}: {
  citations: CaseCitation[];
  judgments: JudgmentDoc[];
}) {
  const [q, setQ] = React.useState("");
  const query = q.trim().toLowerCase();

  const filteredCitations = React.useMemo(() => {
    if (!query) return citations;
    return citations.filter((c) =>
      [c.title, c.detail, c.tag, c.documentTitle]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(query))
    );
  }, [citations, query]);

  const filteredJudgments = React.useMemo(() => {
    if (!query) return judgments;
    return judgments.filter((j) =>
      [j.title, j.court, j.caseNumber, j.judge]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(query))
    );
  }, [judgments, query]);

  const nothing = citations.length === 0 && judgments.length === 0;

  if (nothing) {
    return (
      <EmptyState
        icon={Scale}
        title="No case law yet"
        description="Open a judgment and run the “Case Citations” analysis to surface cited precedents here. Uploaded judgments are detected automatically."
        action={
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110"
          >
            Browse Documents
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search citations, courts, case numbers..."
          className="h-10 w-full rounded-lg border border-border bg-muted pl-9 pr-3 text-[13px] text-foreground outline-none transition focus:border-violet-400 focus:bg-card focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      {/* Judgment documents */}
      <section>
        <h2 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Gavel className="h-3.5 w-3.5" /> Judgments in your library ({filteredJudgments.length})
        </h2>
        {filteredJudgments.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No matching judgments.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredJudgments.map((j) => (
              <Link
                key={j.id}
                href={`/dashboard/documents/${j.id}`}
                className="group rounded-xl border border-border bg-card p-4 transition hover:border-violet-500/40 hover:shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                    <Scale className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[14px] font-semibold text-foreground group-hover:text-violet-500">
                      {j.title}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {j.court}
                      {j.caseNumber ? ` · ${j.caseNumber}` : ""}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-violet-500" />
                </div>
                {(j.judge || j.decisionDate) && (
                  <p className="mt-2.5 border-t border-border pt-2 text-[11px] text-muted-foreground">
                    {j.judge ? `${j.judge}` : ""}
                    {j.judge && j.decisionDate ? " · " : ""}
                    {j.decisionDate ? new Date(j.decisionDate).toLocaleDateString() : ""}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Extracted citations */}
      <section>
        <h2 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Cited precedents ({filteredCitations.length})
        </h2>
        {filteredCitations.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No matching citations.</p>
        ) : (
          <ul className="space-y-2">
            {filteredCitations.map((c, i) => (
              <li
                key={`${c.documentId}-${i}`}
                className="rounded-xl border border-border bg-card p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{c.title}</p>
                    {c.detail && (
                      <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                        {c.detail}
                      </p>
                    )}
                  </div>
                  {c.tag && (
                    <span className="shrink-0 rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-500">
                      {c.tag}
                    </span>
                  )}
                </div>
                <Link
                  href={`/dashboard/documents/${c.documentId}`}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-violet-500 hover:underline"
                >
                  {c.documentTitle}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
