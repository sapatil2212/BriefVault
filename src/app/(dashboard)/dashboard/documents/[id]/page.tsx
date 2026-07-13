import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Sparkles, Quote } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDocumentResults } from "@/lib/ai/services/document-service";
import { AiChat } from "@/components/ai/ai-chat";
import { DocumentHeader } from "@/components/documents/document-header";
import { ExecutiveDashboard } from "@/components/documents/executive-dashboard";
import { AnalysisWorkspace } from "@/components/ai/analysis-workspace";

interface ListItem {
  title: string;
  detail?: string | null;
}

/** Pull `list`-shaped items from a stored analysis result by kind. */
function itemsOf(results: { kind: string; payload: unknown }[], kind: string): ListItem[] {
  const payload = results.find((r) => r.kind === kind)?.payload as
    | { items?: ListItem[] }
    | undefined;
  return Array.isArray(payload?.items) ? payload!.items : [];
}

export const runtime = "nodejs";

interface ExecutiveSummaryPayload {
  overview: string | null;
  purpose: string | null;
  background: string | null;
  decision: string | null;
  outcome: string | null;
  readingTimeSavedMinutes: number;
}

interface Citation {
  chunkId: string;
  page?: number | null;
  paragraph?: number | null;
  quote: string;
}

/** Document intelligence view: metadata + summary + AI workspace (left), chat (right). */
export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const { id } = await params;
  const doc = await getDocumentResults(user.id, id);
  if (!doc) notFound();

  const summaryResult = doc.results.find((r) => r.kind === "EXECUTIVE_SUMMARY");
  const summary = summaryResult?.payload as ExecutiveSummaryPayload | undefined;
  const citations = (summaryResult?.citations as Citation[] | undefined) ?? [];
  const meta = doc.metadata;

  const summaryRows: { label: string; value: string | null }[] = summary
    ? [
        { label: "Overview", value: summary.overview },
        { label: "Purpose", value: summary.purpose },
        { label: "Background", value: summary.background },
        { label: "Decision", value: summary.decision },
        { label: "Outcome", value: summary.outcome },
      ]
    : [];

  // Derive dashboard extras from other stored analyses (real data, no new calls).
  const parties = (meta?.parties ?? null) as
    | { petitioner?: string[]; respondent?: string[] }
    | null;
  const keyIssues = itemsOf(doc.results, "QUESTIONS_BEFORE_COURT").map((i) => i.title);
  const importantDates = itemsOf(doc.results, "DEADLINES").map((i) => ({
    label: i.title,
    detail: i.detail ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <Link
        href="/dashboard/documents"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to documents
      </Link>

      {/* Interactive header — View (modal) + Download + Delete */}
      <DocumentHeader
        documentId={doc.id}
        title={doc.title}
        status={doc.status}
        kind={doc.kind}
        language={doc.language}
        pageCount={doc.pageCount}
        sizeBytes={doc.sizeBytes}
        readingTimeSaved={summary?.readingTimeSavedMinutes ?? null}
        pdfUrl={doc.pdfUrl}
        citations={citations.map((c) => ({
          page: c.page,
          paragraph: c.paragraph,
          quote: c.quote,
        }))}
      />

      {/* Left: intelligence — Right: sticky AI chat */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* Executive Dashboard (Module 1) — metadata + summary + derived */}
          <ExecutiveDashboard
            documentType={doc.kind}
            status={doc.status}
            confidence={summaryResult?.confidence ?? null}
            provider={summaryResult?.provider ?? null}
            readingTimeSavedMinutes={summary?.readingTimeSavedMinutes ?? null}
            court={meta?.court}
            authority={meta?.authority}
            judge={meta?.judge}
            caseNumber={meta?.caseNumber}
            notificationNumber={meta?.notificationNumber}
            decisionDate={meta?.decisionDate ? new Date(meta.decisionDate).toISOString() : null}
            petitioners={parties?.petitioner ?? []}
            respondents={parties?.respondent ?? []}
            decision={summary?.decision ?? null}
            result={summary?.outcome ?? null}
            acts={(meta?.acts as string[] | null) ?? []}
            sections={(meta?.sections as string[] | null) ?? []}
            keywords={(meta?.keywords as string[] | null) ?? []}
            keyIssues={keyIssues}
            importantDates={importantDates}
          />

          {/* Executive Summary */}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-[13px] font-semibold text-foreground">Executive Summary</h2>
              </div>
              {summaryResult && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {summaryResult.provider}
                  <span className="h-1 w-1 rounded-full bg-current opacity-50" />
                  {Math.round((summaryResult.confidence ?? 0) * 100)}%
                </span>
              )}
            </div>

            {!summary ? (
              <p className="mt-3 text-[12px] text-muted-foreground">
                {doc.status === "READY"
                  ? "No summary was generated for this document."
                  : "This document has not been processed yet."}
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {summaryRows.map((row) =>
                  row.value ? (
                    <div
                      key={row.label}
                      className="rounded-lg border border-border bg-muted/30 px-3 py-2"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {row.label}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-foreground">{row.value}</p>
                    </div>
                  ) : null
                )}

                {citations.length > 0 && (
                  <details className="group mt-1 rounded-lg border border-border">
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[11px] font-semibold text-foreground">
                      <Quote className="h-3 w-3 text-muted-foreground" />
                      Citations ({citations.length})
                      <span className="ml-auto text-[11px] font-normal text-muted-foreground transition group-open:rotate-180">
                        ▾
                      </span>
                    </summary>
                    <ul className="space-y-1.5 border-t border-border p-2.5">
                      {citations.map((c, i) => (
                        <li
                          key={i}
                          className="rounded-md bg-muted px-2.5 py-1.5 text-[11px] text-muted-foreground"
                        >
                          <span className="font-medium text-foreground">
                            {c.page != null ? `Page ${c.page}` : "Source"}
                            {c.paragraph != null ? `, ¶${c.paragraph}` : ""}:
                          </span>{" "}
                          <span className="italic">&ldquo;{c.quote}&rdquo;</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </section>

          {/* AI Workspace — all analysis modules */}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-[13px] font-semibold text-foreground">AI Workspace</h2>
              <span className="text-[11px] text-muted-foreground">
                — expand any module to generate it
              </span>
            </div>
            <AnalysisWorkspace
              documentId={doc.id}
              seed={doc.results.map((r) => ({
                kind: r.kind,
                payload: r.payload,
                confidence: r.confidence,
                provider: r.provider,
              }))}
            />
          </section>
        </div>

        {/* Right: sticky, document-scoped AI chat */}
        <aside className="xl:col-span-1">
          <div className="sticky top-0 h-[calc(100vh-7rem)] min-h-[520px]">
            <AiChat documentId={doc.id} title="Ask this document" />
          </div>
        </aside>
      </div>
    </div>
  );
}


