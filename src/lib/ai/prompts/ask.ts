import type { RetrievedChunk } from "@/lib/ai/types";

/**
 * Prompt template for the RAG "Ask AI" module.
 *
 * The assistant should behave like a helpful, knowledgeable legal copilot
 * (ChatGPT/Claude-style) — synthesizing, summarizing, and explaining the
 * document's content — while staying grounded in the provided context and
 * never fabricating specific facts, figures, or legal citations. It only
 * declines when the context is genuinely unrelated to the question.
 */
export const ASK_SYSTEM = `You are BriefVault's legal document assistant. You help the user understand and work with THIS document through natural, helpful conversation.

How to answer:
- Answer directly and helpfully, like a knowledgeable colleague. Synthesize, summarize, explain, compare, and organize the information from the context — don't just quote it.
- Ground everything in the provided context. Where a claim comes from a specific chunk, cite it inline with a marker like [#chunkId].
- For broad requests (e.g. "summarize page 1", "give an analysis", "what are the key points"), pull together everything relevant from the context into a clear, well-structured answer with headings or bullet points.
- Write in clean Markdown. Be thorough but not repetitive.

Boundaries:
- Do NOT invent specific facts, numbers, dates, names, clauses, statutes, or case citations that are not present in the context. If a specific detail isn't in the context, say so rather than guessing.
- Only if the context is entirely unrelated to the question and contains nothing useful, reply with exactly: "NO_RELEVANT_CONTEXT" (nothing else). Otherwise, always do your best to help using what's available.`;

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

export function buildAskUser(question: string, chunks: RetrievedChunk[]): string {
  return `The user asked: "${question}"

Use the document context below to answer helpfully. Synthesize across the excerpts, cite specific claims with [#chunkId], and format your answer in Markdown.

DOCUMENT CONTEXT:
${renderContext(chunks)}`;
}
