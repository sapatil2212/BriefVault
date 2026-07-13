"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  ChevronDown,
  Download,
  Maximize2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  analysisCatalog,
  groupLabels,
  type AnalysisGroup,
  type AnalysisRender,
} from "@/lib/ai/analysis/catalog";
import { useAnalyze } from "@/hooks/use-analysis";
import { AnalysisResultBody } from "@/components/ai/analysis-render";

interface SeedResult {
  kind: string;
  payload: unknown;
  confidence?: number;
  provider?: string | null;
}

interface CardState {
  payload: unknown;
  confidence?: number;
  provider?: string | null;
  loaded: boolean;
}

/**
 * AI Workspace: every analysis module for a document, grouped and generated
 * on demand. Existing results are seeded so previously-generated analyses show
 * immediately; others generate on first expand.
 */
export function AnalysisWorkspace({
  documentId,
  seed = [],
}: {
  documentId: string;
  seed?: SeedResult[];
}) {
  const initial = React.useMemo(() => {
    const map: Record<string, CardState> = {};
    for (const r of seed) {
      map[r.kind] = { payload: r.payload, confidence: r.confidence, provider: r.provider, loaded: true };
    }
    return map;
  }, [seed]);

  const [state, setState] = React.useState<Record<string, CardState>>(initial);
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const [pending, setPending] = React.useState<string | null>(null);
  const [fullscreen, setFullscreen] = React.useState<string | null>(null);
  const analyze = useAnalyze();

  /** Download a module's result directly as a PDF using jsPDF (no print dialog). */
  async function exportPdf(kind: string, label: string) {
    const card = state[kind];
    if (!card?.loaded) return;

    // Dynamically import jsPDF to keep initial bundle small
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = margin;

    // ── Helper: add text with automatic page breaks ───────────────────────────
    function addText(
      text: string,
      opts: { size?: number; bold?: boolean; color?: [number, number, number] } = {}
    ) {
      const { size = 10, bold = false, color = [40, 40, 40] } = opts;
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, contentW) as string[];
      const lineH = size * 0.4;
      for (const line of lines) {
        if (y + lineH > pageH - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineH + 1.2;
      }
    }

    function addSpacing(mm = 4) { y += mm; }

    function addDivider(color: [number, number, number] = [220, 220, 230]) {
      if (y + 1 > pageH - margin) { doc.addPage(); y = margin; }
      doc.setDrawColor(...color);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    }

    // ── Header ────────────────────────────────────────────────────────────────
    // Indigo accent bar
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, y - 2, contentW, 0.8, "F");
    y += 4;

    addText("BriefVault — AI Legal Intelligence", { size: 8, color: [79, 70, 229] });
    addSpacing(1);
    addText(label, { size: 17, bold: true, color: [15, 15, 35] });
    addSpacing(2);
    addText(
      new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
      { size: 8, color: [120, 120, 140] }
    );
    addSpacing(3);
    addDivider([79, 70, 229]);
    addSpacing(2);

    // ── Content: render by known payload shape ────────────────────────────────
    const catalogItem = analysisCatalog.find((c) => c.kind === kind);
    const renderShape = catalogItem?.render ?? "list";

    function renderSections(p: unknown) {
      const sections = (p as { sections?: { heading: string; body: string | null; page?: number | null }[] })?.sections ?? [];
      if (!sections.length) { addText("No content was extracted.", { size: 10, color: [150, 150, 160] }); return; }
      sections.forEach((s) => {
        if (!s.body?.trim()) return;
        addText(s.heading.toUpperCase(), { size: 9, bold: true, color: [79, 70, 229] });
        addSpacing(0.5);
        addText(s.body.trim(), { size: 10 });
        if (s.page != null) addText(`Page ${s.page}`, { size: 8, color: [150, 150, 160] });
        addSpacing(4);
      });
    }

    function renderList(p: unknown) {
      const items = (p as { items?: { title: string; detail?: string | null; tag?: string | null; page?: number | null }[] })?.items ?? [];
      if (!items.length) { addText("No items found.", { size: 10, color: [150, 150, 160] }); return; }
      items.forEach((it, i) => {
        const bullet = `${i + 1}. ${it.title}${it.tag ? `  [${it.tag}]` : ""}`;
        addText(bullet, { size: 10, bold: true, color: [30, 30, 60] });
        if (it.detail) { addSpacing(0.5); addText(it.detail, { size: 9.5, color: [80, 80, 100] }); }
        if (it.page != null) addText(`Page ${it.page}`, { size: 8, color: [150, 150, 160] });
        addSpacing(3);
      });
    }

    function renderRisk(p: unknown) {
      const risks = (p as { risks?: { category: string; level: string; reasoning: string }[] })?.risks ?? [];
      if (!risks.length) { addText("No risks identified.", { size: 10, color: [150, 150, 160] }); return; }
      risks.forEach((r) => {
        const levelColor: [number, number, number] =
          r.level === "High" ? [185, 28, 28] : r.level === "Medium" ? [161, 98, 7] : [21, 128, 61];
        addText(`${r.category}`, { size: 10, bold: true, color: [30, 30, 60] });
        addText(`Risk Level: ${r.level}`, { size: 9, bold: true, color: levelColor });
        addSpacing(0.5);
        addText(r.reasoning, { size: 9.5, color: [80, 80, 100] });
        addSpacing(4);
        addDivider();
      });
    }

    function renderChecklist(p: unknown) {
      const items = (p as { items?: { label: string; done: boolean }[] })?.items ?? [];
      if (!items.length) { addText("No checklist items found.", { size: 10, color: [150, 150, 160] }); return; }
      items.forEach((it) => {
        const prefix = it.done ? "[✓]" : "[ ]";
        addText(`${prefix}  ${it.label}`, { size: 10, color: it.done ? [21, 128, 61] : [40, 40, 40] });
        addSpacing(1.5);
      });
    }

    if (renderShape === "sections") renderSections(card.payload);
    else if (renderShape === "risk") renderRisk(card.payload);
    else if (renderShape === "checklist") renderChecklist(card.payload);
    else renderList(card.payload);


    // ── Footer on every page ──────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 175);
      doc.setFont("helvetica", "normal");
      doc.text(
        "BriefVault  ·  Brightwave Digital Products  ·  Pune, India",
        margin,
        pageH - 8
      );
      doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 8, { align: "right" });
    }

    // ── Trigger direct download ───────────────────────────────────────────────
    doc.save(`${label.replace(/\s+/g, "-").toLowerCase()}-briefvault.pdf`);
  }


  React.useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const groups: AnalysisGroup[] = ["summary", "litigation", "compliance", "references"];

  async function generate(kind: string, force = false) {
    setPending(kind);
    try {
      const data = await analyze.mutateAsync({ documentId, kind, force });
      setState((s) => ({
        ...s,
        [kind]: { payload: data.payload, confidence: data.confidence, provider: data.provider, loaded: true },
      }));
      setOpen((o) => ({ ...o, [kind]: true }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate analysis.");
    } finally {
      setPending(null);
    }
  }

  function toggle(kind: string) {
    // Only expand/collapse — generation is explicit via the Generate button.
    setOpen((o) => ({ ...o, [kind]: !o[kind] }));
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const items = analysisCatalog.filter((c) => c.group === group);
        return (
          <div key={group}>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {groupLabels[group]}
            </h3>
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
              {items.map((item) => {
                const card = state[item.kind];
                const isPending = pending === item.kind;
                const isOpen = open[item.kind];
                return (
                  <div key={item.kind} className="rounded-lg border border-border bg-card">
                    <button
                      onClick={() => toggle(item.kind)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                          card?.loaded
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-foreground">{item.label}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {card?.loaded ? `Generated · ${card.provider ?? "ai"}` : item.description}
                        </p>
                      </div>
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                      ) : (
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition",
                            isOpen && "rotate-180"
                          )}
                        />
                      )}
                    </button>

                    {isOpen && (
                      <div className="border-t border-border px-3 py-2.5">
                        {isPending && !card?.loaded ? (
                          <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                          </p>
                        ) : card?.loaded ? (
                          <>
                            <AnalysisResultBody
                              render={item.render as AnalysisRender}
                              payload={card.payload}
                            />
                            <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                              <span className="text-[10px] text-muted-foreground">
                                confidence {Math.round((card.confidence ?? 0) * 100)}%
                              </span>
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => setFullscreen(item.kind)}
                                  title="Full screen"
                                  aria-label="Full screen"
                                  className="text-muted-foreground transition hover:text-foreground"
                                >
                                  <Maximize2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => exportPdf(item.kind, item.label)}
                                  title="Download PDF"
                                  aria-label="Download PDF"
                                  className="text-muted-foreground transition hover:text-foreground"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => generate(item.kind, true)}
                                  disabled={isPending}
                                  className="flex items-center gap-1 text-[11px] font-medium text-violet-500 hover:underline disabled:opacity-50"
                                >
                                  <RefreshCw className="h-3 w-3" /> Regenerate
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-start gap-2">
                            <p className="text-[12px] text-muted-foreground">{item.description}</p>
                            <button
                              onClick={() => generate(item.kind)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 hover:bg-violet-700 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                            >
                              <Sparkles className="h-3 w-3" /> Generate
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Full-screen viewer */}
      <AnimatePresence>
        {fullscreen && (() => {
          const item = analysisCatalog.find((c) => c.kind === fullscreen);
          const card = state[fullscreen];
          if (!item || !card?.loaded) return null;
          return (
            <motion.div
              className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setFullscreen(null)}
                aria-hidden
              />
              <motion.div
                className="relative flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ type: "spring", duration: 0.32, bounce: 0.2 }}
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[13px] font-semibold text-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => exportPdf(item.kind, item.label)}
                      title="Download PDF"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setFullscreen(null)}
                      aria-label="Close"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <AnalysisResultBody
                    render={item.render as AnalysisRender}
                    payload={card.payload}
                  />
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
