import type { DocumentKind } from "@prisma/client";
import {
  UnsupportedFormatError,
  type ExtractionInput,
  type ExtractionResult,
  type TextExtractor,
} from "./types";
import { TxtExtractor } from "./txt";
import { PdfExtractor } from "./pdf";
import { DocxExtractor } from "./docx";
import { ImageOcrExtractor } from "./ocr";

export type {
  ExtractionInput,
  ExtractionResult,
  ExtractedPage,
  TextExtractor,
} from "./types";
export { UnsupportedFormatError } from "./types";

/**
 * Registered extractors, tried in order: text, PDF, DOCX, and image OCR
 * (Tesseract). Each implements the same {@link TextExtractor} interface, so
 * adding/replacing engines never touches the pipeline.
 */
const extractors: TextExtractor[] = [
  new TxtExtractor(),
  new PdfExtractor(),
  new DocxExtractor(),
  new ImageOcrExtractor(),
];

/** Guess the document kind from mime type / filename for status reporting. */
export function detectKind(input: ExtractionInput): DocumentKind {
  const mime = (input.mimeType ?? "").toLowerCase();
  const name = (input.fileName ?? "").toLowerCase();
  if (input.text != null) return "TXT";
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessing") ||
    name.endsWith(".docx")
  ) {
    return "DOCX";
  }
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("text/") || name.endsWith(".txt")) return "TXT";
  return "UNKNOWN";
}

/**
 * Extract text using the first extractor that supports the input.
 * @throws {UnsupportedFormatError} when no registered extractor matches.
 */
export async function extractText(
  input: ExtractionInput
): Promise<ExtractionResult> {
  const extractor = extractors.find((e) => e.supports(input));
  if (!extractor) {
    const kind = detectKind(input);
    throw new UnsupportedFormatError(
      `No extractor available for "${kind}". Supported formats: plain text, PDF, ` +
        `DOCX, and images (PNG/JPG/TIFF via OCR).`
    );
  }
  return extractor.extract(input);
}

/** Expose registration so future extractors can be added at runtime/tests. */
export function registerExtractor(extractor: TextExtractor): void {
  extractors.unshift(extractor);
}
