import {
  UnsupportedFormatError,
  type ExtractionInput,
  type ExtractionResult,
  type ExtractedPage,
  type TextExtractor,
} from "./types";

/** Approximate characters per page used to synthesize page boundaries. */
const CHARS_PER_PAGE = 3000;

/**
 * DOCX text extractor built on `mammoth` (extractRawText). Word documents have
 * no fixed pagination, so pages are synthesized by character count to keep
 * downstream chunking/citations page-aware.
 */
export class DocxExtractor implements TextExtractor {
  readonly kind = "DOCX" as const;

  supports(input: ExtractionInput): boolean {
    if (input.text != null) return false;
    const mime = (input.mimeType ?? "").toLowerCase();
    const name = (input.fileName ?? "").toLowerCase();
    return (
      mime.includes("officedocument.wordprocessingml") ||
      mime.includes("msword") ||
      name.endsWith(".docx")
    );
  }

  async extract(input: ExtractionInput): Promise<ExtractionResult> {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: input.buffer });
    const text = value.replace(/\r\n/g, "\n").trim();

    if (text.length < 10) {
      throw new UnsupportedFormatError(
        "This DOCX file contained no extractable text. The file has been stored."
      );
    }

    const pages: ExtractedPage[] = [];
    for (let i = 0, page = 1; i < text.length; i += CHARS_PER_PAGE, page++) {
      pages.push({ page, text: text.slice(i, i + CHARS_PER_PAGE) });
    }

    return {
      kind: this.kind,
      text,
      pages: pages.length ? pages : [{ page: 1, text }],
      pageCount: pages.length || 1,
      usedOcr: false,
    };
  }
}
