"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ViewerCitation {
  page?: number | null;
  paragraph?: number | null;
  quote: string;
}

/**
 * PDF viewer built on the browser's native PDF renderer via an <iframe>.
 *
 * This avoids the bundler/interop fragility of canvas-based renderers while
 * still providing zoom, search and text selection (from the built-in viewer).
 * Page navigation and citation jumps are driven through the PDF URL fragment
 * (`#page=N`), which the native viewers honor.
 */
export function PdfViewer({
  fileUrl,
  citations = [],
}: {
  fileUrl: string;
  citations?: ViewerCitation[];
}) {
  const [page, setPage] = React.useState(1);

  const citedPages = React.useMemo(() => {
    const pages = new Set<number>();
    for (const c of citations) if (c.page) pages.add(c.page);
    return [...pages].sort((a, b) => a - b);
  }, [citations]);

  // Changing the fragment reloads the embedded viewer at the requested page.
  const src = `${fileUrl}#page=${page}&view=FitH&toolbar=1`;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
            <span>Page</span>
            <input
              type="number"
              value={page}
              min={1}
              onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
              className="h-8 w-14 rounded-md border border-border bg-muted text-center text-foreground outline-none focus:border-violet-400"
            />
          </div>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition hover:bg-muted"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </a>
      </div>

      {/* Citation jump strip */}
      {citedPages.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border px-3 py-2">
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Quote className="h-3 w-3" /> Jump to citation:
          </span>
          {citedPages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition",
                page === p
                  ? "border-violet-500/50 bg-violet-500/10 text-violet-500"
                  : "border-border text-muted-foreground hover:border-violet-500/40 hover:bg-violet-500/10"
              )}
            >
              Page {p}
            </button>
          ))}
        </div>
      )}

      {/* Native embedded viewer */}
      <iframe
        key={src}
        src={src}
        title="PDF document"
        className="h-[720px] w-full rounded-b-xl bg-muted"
      />
    </div>
  );
}
