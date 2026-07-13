import type { DocumentKind } from "@prisma/client";

/** A single extracted page with 1-based page number. */
export interface ExtractedPage {
  page: number;
  text: string;
}

export interface ExtractionResult {
  kind: DocumentKind;
  text: string;
  pages: ExtractedPage[];
  pageCount: number;
  language?: string;
  /** OCR confidence 0–1 when OCR was used; undefined for native text. */
  ocrConfidence?: number;
  /** True when text came from OCR rather than an embedded text layer. */
  usedOcr: boolean;
}

export interface ExtractionInput {
  buffer: Buffer;
  mimeType?: string | null;
  fileName?: string | null;
  /** Pre-supplied plain text (e.g. TXT paste) bypasses binary extraction. */
  text?: string | null;
}

/** Contract for a format-specific text extractor. */
export interface TextExtractor {
  readonly kind: DocumentKind;
  supports(input: ExtractionInput): boolean;
  extract(input: ExtractionInput): Promise<ExtractionResult>;
}

/** Thrown when no extractor is available for the given input. */
export class UnsupportedFormatError extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = "UnsupportedFormatError";
  }
}
