import type {
  ExtractionInput,
  ExtractionResult,
  ExtractedPage,
  TextExtractor,
} from "./types";

/** Approximate characters per page used to paginate plain text. */
const CHARS_PER_PAGE = 3000;

/**
 * Plain-text extractor. Accepts either pre-supplied `text` or a UTF-8 buffer,
 * and synthesizes page boundaries so downstream chunking/citations still have
 * page numbers to reference.
 */
export class TxtExtractor implements TextExtractor {
  readonly kind = "TXT" as const;

  supports(input: ExtractionInput): boolean {
    if (input.text != null) return true;
    const mime = input.mimeType ?? "";
    const name = input.fileName ?? "";
    return mime.startsWith("text/") || name.toLowerCase().endsWith(".txt");
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const text = (input.text ?? input.buffer.toString("utf-8")).replace(/\r\n/g, "\n");

    const pages: ExtractedPage[] = [];
    // Prefer explicit form-feed page breaks when present.
    if (text.includes("\f")) {
      text.split("\f").forEach((chunk, i) => {
        pages.push({ page: i + 1, text: chunk.trim() });
      });
    } else {
      for (let i = 0, page = 1; i < text.length; i += CHARS_PER_PAGE, page++) {
        pages.push({ page, text: text.slice(i, i + CHARS_PER_PAGE) });
      }
    }
    if (pages.length === 0) pages.push({ page: 1, text });

    return {
      kind: this.kind,
      text,
      pages,
      pageCount: pages.length,
      usedOcr: false,
    };
  }
}
