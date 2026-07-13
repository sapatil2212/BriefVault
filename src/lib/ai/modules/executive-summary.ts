import "server-only";
import { z } from "zod";
import { aiConfig } from "@/lib/ai/config";
import { getLlmProvider, extractiveSummarize } from "@/lib/ai/providers/llm";
import {
  EXECUTIVE_SUMMARY_SYSTEM,
  buildExecutiveSummaryUser,
} from "@/lib/ai/prompts";
import type { Citation, ModuleResult, RetrievedChunk } from "@/lib/ai/types";

/** Structured Executive Summary output. */
export interface ExecutiveSummaryPayload {
  overview: string | null;
  purpose: string | null;
  background: string | null;
  decision: string | null;
  outcome: string | null;
  /** Estimated reading time saved, in minutes, vs. reading the full document. */
  readingTimeSavedMinutes: number;
}

const llmSchema = z.object({
  overview: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  background: z.string().nullable().optional(),
  decision: z.string().nullable().optional(),
  outcome: z.string().nullable().optional(),
  citations: z
    .array(z.object({ chunkId: z.string(), quote: z.string() }))
    .optional(),
  confidence: z.number().min(0).max(1).optional(),
});

/** ~200 wpm reading speed; summary assumed ~1/6th of full reading time. */
function readingTimeSaved(fullText: string): number {
  const words = fullText.trim().split(/\s+/).length;
  const fullMinutes = words / 200;
  return Math.max(1, Math.round(fullMinutes * 0.83));
}

function toCitations(
  refs: { chunkId: string; quote: string }[],
  chunks: RetrievedChunk[]
): Citation[] {
  const byId = new Map(chunks.map((c) => [c.chunkId, c]));
  return refs
    .filter((r) => byId.has(r.chunkId))
    .map((r) => {
      const c = byId.get(r.chunkId)!;
      return {
        chunkId: r.chunkId,
        page: c.page,
        paragraph: c.paragraph,
        heading: c.heading,
        quote: r.quote.slice(0, 300),
      };
    });
}

/**
 * Generate an Executive Summary for a document from its most relevant chunks.
 *
 * Grounding contract: only the supplied chunks are used. With a real LLM the
 * prompt enforces citations; without one, a deterministic extractive summary is
 * produced (never fabricated). Returns `notFound: true` when there is no
 * meaningful content to summarize.
 */
export async function generateExecutiveSummary(
  documentTitle: string,
  fullText: string,
  chunks: RetrievedChunk[]
): Promise<ModuleResult<ExecutiveSummaryPayload>> {
  const context = chunks.slice(0, aiConfig.maxContextChunks);
  const readingTimeSavedMinutes = readingTimeSaved(fullText);

  if (context.length === 0 || fullText.trim().length < 40) {
    const llm = getLlmProvider();
    return {
      payload: {
        overview: null,
        purpose: null,
        background: null,
        decision: null,
        outcome: null,
        readingTimeSavedMinutes,
      },
      citations: [],
      confidence: 0,
      provider: llm.name,
      model: llm.model,
      notFound: true,
    };
  }

  const llm = getLlmProvider();

  // ── Real LLM path ────────────────────────────────────────────────────────
  if (llm.name !== "extractive" && llm.isReady()) {
    try {
      const completion = await llm.complete(
        [
          { role: "system", content: EXECUTIVE_SUMMARY_SYSTEM },
          { role: "user", content: buildExecutiveSummaryUser(documentTitle, context) },
        ],
        { json: true, temperature: 0.2 }
      );

      const parsed = llmSchema.parse(JSON.parse(completion.text));
      const citations = toCitations(parsed.citations ?? [], context);

      return {
        payload: {
          overview: parsed.overview ?? null,
          purpose: parsed.purpose ?? null,
          background: parsed.background ?? null,
          decision: parsed.decision ?? null,
          outcome: parsed.outcome ?? null,
          readingTimeSavedMinutes,
        },
        citations,
        confidence: parsed.confidence ?? (citations.length ? 0.7 : 0.4),
        provider: completion.provider,
        model: completion.model,
        tokensUsed: completion.tokensUsed,
        notFound: !parsed.overview,
      };
    } catch (err) {
      // Fall through to the deterministic path rather than failing the request.
      console.warn("[executive-summary] LLM path failed, using fallback:", err);
    }
  }

  // ── Deterministic extractive fallback ──────────────────────────────────────
  const combined = context.map((c) => c.content).join("\n\n");
  const overview = extractiveSummarize(combined, 4);
  const background = extractiveSummarize(
    context.slice(0, Math.ceil(context.length / 2)).map((c) => c.content).join(" "),
    2
  );
  // Cite the chunks that contributed the most (first few by relevance/order).
  const citations: Citation[] = context.slice(0, 3).map((c) => ({
    chunkId: c.chunkId,
    page: c.page,
    paragraph: c.paragraph,
    heading: c.heading,
    quote: c.content.slice(0, 200),
  }));

  return {
    payload: {
      overview: overview || null,
      purpose: null,
      background: background || null,
      decision: null,
      outcome: null,
      readingTimeSavedMinutes,
    },
    citations,
    confidence: overview ? 0.45 : 0,
    provider: "extractive",
    model: "extractive-v1",
    notFound: !overview,
  };
}
