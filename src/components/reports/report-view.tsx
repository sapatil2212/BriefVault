"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";

interface Section {
  heading: string;
  body: string;
}

/** Render inline **bold** segments within a line. */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-slate-900">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{p}</React.Fragment>
    )
  );
}

/** Render a section body: bullet lists and paragraphs with inline bold. */
function renderBody(body: string): React.ReactNode {
  const lines = body.split("\n").filter((l) => l.trim().length > 0);
  const nodes: React.ReactNode[] = [];
  let list: string[] = [];

  const flush = () => {
    if (list.length) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="my-1.5 list-disc space-y-1 pl-5">
          {list.map((li, i) => (
            <li key={i}>{renderInline(li)}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) {
      list.push(line.replace(/^\s*-\s+/, ""));
    } else {
      flush();
      nodes.push(
        <p key={`p-${nodes.length}`} className="mb-2 last:mb-0">
          {renderInline(line)}
        </p>
      );
    }
  }
  flush();
  return nodes;
}

/** Strip markdown bold/list syntax for plain-text PDF rendering. */
function stripMarkdown(line: string): string {
  return line.replace(/\*\*([^*]+)\*\*/g, "$1");
}

/**
 * Generate and download the report as a real PDF (no browser print dialog).
 * Uses jsPDF to lay out the title, meta, and each section directly as text,
 * with word-wrapping and automatic pagination — produces a small, selectable
 * PDF rather than a rasterized screenshot.
 */
async function downloadPdf(title: string, meta: string, sections: Section[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  const titleLines = doc.splitTextToSize(title, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 22 + 4;

  // Meta
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(meta, margin, y);
  y += 18;

  // Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  for (const sec of sections) {
    ensureSpace(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(109, 40, 217); // violet-700
    const headingLines = doc.splitTextToSize(sec.heading, maxWidth);
    ensureSpace(headingLines.length * 16 + 8);
    doc.text(headingLines, margin, y);
    y += headingLines.length * 16 + 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(51, 65, 85); // slate-700

    const rawLines = sec.body.split("\n").filter((l) => l.trim().length > 0);
    for (const raw of rawLines) {
      const isBullet = /^\s*-\s+/.test(raw);
      const text = stripMarkdown(isBullet ? raw.replace(/^\s*-\s+/, "") : raw);
      const indent = isBullet ? 14 : 0;
      const prefix = isBullet ? "•  " : "";
      const wrapped = doc.splitTextToSize(prefix + text, maxWidth - indent);
      ensureSpace(wrapped.length * 14 + 6);
      doc.text(wrapped, margin + indent, y);
      y += wrapped.length * 14 + 6;
    }
    y += 8;
  }

  doc.save(`${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
}

/** Report reader with a single "Download PDF" action (no print dialog). */
export function ReportView({
  title,
  sections,
  meta,
}: {
  title: string;
  sections: Section[];
  /** Kept for backward-compat with existing callers; no longer used for export. */
  markdown?: string;
  meta: string;
}) {
  const [downloading, setDownloading] = React.useState(false);

  async function download() {
    setDownloading(true);
    try {
      await downloadPdf(title, meta, sections);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-[12px] text-muted-foreground">{meta}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={download}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Printable report body */}
      <article className="rounded-xl border border-slate-200 bg-white p-8 print:border-0 print:p-0">
        <header className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-[12px] text-slate-400">{meta}</p>
        </header>
        <div className="space-y-6">
          {sections.map((sec, i) => (
            <section key={i}>
              <h3 className="mb-1.5 text-[15px] font-semibold text-violet-700">
                {sec.heading}
              </h3>
              <div className="text-[14px] leading-relaxed text-slate-700">
                {renderBody(sec.body)}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
