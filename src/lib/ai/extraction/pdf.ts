import {
  UnsupportedFormatError,
  type ExtractionInput,
  type ExtractionResult,
  type ExtractedPage,
  type TextExtractor,
} from "./types";

/** Below this many characters of extracted text, a PDF is treated as scanned. */
const SCANNED_TEXT_THRESHOLD = 40;

/**
 * PDF text extractor built on `pdf-parse` v2 (pdfjs-based). `getText()` returns
 * page-wise text, which we preserve so downstream chunking and citations keep
 * accurate page numbers.
 *
 * PDFs with no usable text layer (scanned images) raise
 * {@link UnsupportedFormatError} — OCR is a later phase, and the original file
 * is still preserved by the upload service.
 */
export class PdfExtractor implements TextExtractor {
  readonly kind = "PDF" as const;

  supports(input: ExtractionInput): boolean {
    if (input.text != null) return false;
    const mime = (input.mimeType ?? "").toLowerCase();
    const name = (input.fileName ?? "").toLowerCase();
    return mime.includes("pdf") || name.endsWith(".pdf");
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(input.buffer) });

    try {
      const result = await parser.getText();

      const pages: ExtractedPage[] = result.pages.map((p) => ({
        page: p.num,
        text: (p.text ?? "").replace(/\s+/g, " ").trim(),
      }));

      const fullText =
        pages.map((p) => p.text).join("\n\n").trim() || (result.text ?? "").trim();

      if (fullText.length < SCANNED_TEXT_THRESHOLD) {
        throw new UnsupportedFormatError(
          "This PDF has no extractable text layer and appears to be scanned. " +
            "OCR support arrives in a later phase; the file has been stored."
        );
      }

      return {
        kind: this.kind,
        text: fullText,
        pages: pages.length ? pages : [{ page: 1, text: fullText }],
        pageCount: result.total || pages.length || 1,
        usedOcr: false,
      };
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }
}
