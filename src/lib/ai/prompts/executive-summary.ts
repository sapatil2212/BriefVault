import type { RetrievedChunk } from "@/lib/ai/types";

/**
 * Prompt template for the Executive Summary module.
 *
 * Prompts live here — never inline in services — so they can be versioned,
 * A/B tested, and swapped per provider. The template enforces citation-backed,
 * grounded output and an explicit "information not found" escape hatch.
 */

export const EXECUTIVE_SUMMARY_SYSTEM = `You are a meticulous legal analyst for BriefVault.
You produce concise, accurate, citation-backed summaries of legal and regulatory documents.
Rules:
- Use ONLY the provided context. Never invent facts, dates, parties, or citations.
- Every substantive claim must reference a source marker like [#chunkId].
- If the context does not contain enough information for a field, set it to null.
- Respond with a single valid JSON object and nothing else.`;

/** Shape the model must return (mirrored by the Zod parser in the module). */
export const EXECUTIVE_SUMMARY_SCHEMA_HINT = `{
  "overview": string | null,
  "purpose": string | null,
  "background": string | null,
  "decision": string | null,
  "outcome": string | null,
  "citations": [{ "chunkId": string, "quote": string }],
  "confidence": number
}`;

function renderContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c) => {
      const loc = [
        c.heading ? `heading: ${c.heading}` : null,
        c.page != null ? `page: ${c.page}` : null,
        c.paragraph != null ? `paragraph: ${c.paragraph}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `[#${c.chunkId}]${loc ? ` (${loc})` : ""}\n${c.content}`;
    })
    .join("\n\n---\n\n");
}

export function buildExecutiveSummaryUser(
  title: string,
  chunks: RetrievedChunk[]
): string {
  return `Document title: ${title}

Summarize the document into an executive summary using ONLY the context below.
Return JSON matching exactly this shape:
${EXECUTIVE_SUMMARY_SCHEMA_HINT}

Guidelines:
- "overview": 2-4 sentence high-level summary.
- "purpose": why the document exists / what it seeks to achieve.
- "background": relevant prior context or facts.
- "decision": the ruling, directive, or key determination (null if none).
- "outcome": the practical effect or result (null if none).
- "citations": source markers you relied on, each with a short verbatim quote.
- "confidence": 0-1 self-assessed grounding confidence.

CONTEXT:
${renderContext(chunks)}`;
}
