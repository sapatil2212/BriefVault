import { estimateTokens } from "./clean";
import type { ExtractedPage } from "@/lib/ai/extraction";

/** A structure-aware chunk ready for embedding + citation. */
export interface DocumentChunkDraft {
  index: number;
  content: string;
  heading: string | null;
  pageNumber: number | null;
  paragraphNo: number | null;
  tokenCount: number;
  metadata: {
    source: string;
    startChar?: number;
  };
}

interface ChunkOptions {
  /** Soft upper bound on chunk size in estimated tokens. */
  maxTokens?: number;
  /** Minimum tokens before a chunk can be emitted (avoids tiny fragments). */
  minTokens?: number;
}

/** Heading detection: numbered sections, ALL-CAPS lines, "Section X" etc. */
function isHeading(line: string): boolean {
  const l = line.trim();
  if (l.length === 0 || l.length > 120) return false;
  if (/^(chapter|part|section|article|clause|schedule|annexure)\b/i.test(l)) return true;
  if (/^\d+(\.\d+)*\.?\s+\S/.test(l)) return true; // 1., 1.2, 3.4.5
  if (/^[A-Z][A-Z0-9 .,'&()-]{4,}$/.test(l) && !/[.!?]$/.test(l)) return true; // ALL CAPS
  return false;
}

/**
 * Structure-aware chunker. Splits along headings and paragraph boundaries
 * (never fixed token windows), attaching the current heading, page number and
 * paragraph ordinal to every chunk so citations resolve precisely. Oversized
 * paragraphs are softly divided at sentence boundaries.
 */
export function chunkDocument(
  pages: ExtractedPage[],
  options: ChunkOptions = {}
): DocumentChunkDraft[] {
  const maxTokens = options.maxTokens ?? 350;
  const minTokens = options.minTokens ?? 40;

  const chunks: DocumentChunkDraft[] = [];
  let currentHeading: string | null = null;
  let paragraphNo = 0;
  let index = 0;

  let buffer = "";
  let bufferPage = pages[0]?.page ?? 1;
  let bufferHeading: string | null = null;

  const flush = () => {
    const content = buffer.trim();
    if (!content) {
      buffer = "";
      return;
    }
    chunks.push({
      index: index++,
      content,
      heading: bufferHeading,
      pageNumber: bufferPage,
      paragraphNo: paragraphNo || null,
      tokenCount: estimateTokens(content),
      metadata: { source: `page:${bufferPage}` },
    });
    buffer = "";
  };

  for (const { page, text } of pages) {
    const paragraphs = text.split(/\n\s*\n/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Heading lines reset the section context and force a chunk boundary.
      if (isHeading(trimmed)) {
        flush();
        currentHeading = trimmed.replace(/\s+/g, " ");
        continue;
      }

      paragraphNo++;

      if (buffer === "") {
        bufferPage = page;
        bufferHeading = currentHeading;
      }

      const prospective = buffer ? `${buffer}\n\n${trimmed}` : trimmed;

      if (estimateTokens(prospective) <= maxTokens) {
        buffer = prospective;
        continue;
      }

      // Prospective too big: flush what we have if it's substantial.
      if (estimateTokens(buffer) >= minTokens) {
        flush();
        bufferPage = page;
        bufferHeading = currentHeading;
      }

      // If a single paragraph exceeds the budget, split at sentences.
      if (estimateTokens(trimmed) > maxTokens) {
        const sentences = trimmed.split(/(?<=[.!?])\s+/);
        let piece = "";
        for (const sentence of sentences) {
          const next = piece ? `${piece} ${sentence}` : sentence;
          if (estimateTokens(next) > maxTokens && piece) {
            buffer = piece;
            flush();
            piece = sentence;
            bufferPage = page;
            bufferHeading = currentHeading;
          } else {
            piece = next;
          }
        }
        buffer = piece;
      } else {
        buffer = trimmed;
      }
    }
  }

  flush();
  return chunks;
}
