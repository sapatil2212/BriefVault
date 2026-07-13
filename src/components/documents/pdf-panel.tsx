"use client";

import { PdfViewer, type ViewerCitation } from "./pdf-viewer";

/** Thin client wrapper so server pages can embed the PDF viewer. */
export function PdfPanel({
  fileUrl,
  citations,
}: {
  fileUrl: string;
  citations?: ViewerCitation[];
}) {
  return <PdfViewer fileUrl={fileUrl} citations={citations} />;
}
