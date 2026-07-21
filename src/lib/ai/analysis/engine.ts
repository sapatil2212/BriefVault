import "server-only";
import type { AiResultKind } from "@prisma/client";
import { aiConfig } from "@/lib/ai/config";
import { getLlmProvider } from "@/lib/ai/providers/llm";
import { getAnalysisDef } from "./registry";
import type { AnalysisPayload } from "./types";
import type { Citation, ModuleResult, RetrievedChunk } from "@/lib/ai/types";

/** Derive grounding citations from the context chunks that were used. */
function citationsFrom(chunks: RetrievedChunk[], max = 4): Citation[] {
  return chunks.slice(0, max).map((c) => ({
    chunkId: c.chunkId,
    page: c.page,
    paragraph: c.paragraph,
    heading: c.heading,
    quote: c.content.slice(0, 200),
  }));
}

/**
 * Resolve each item/section `ref` (a context chunk id the model cited) to its
 * real page/paragraph, so the UI can show per-item citations. Refs that don't
 * match a supplied chunk are dropped (never fabricate a location).
 */
function resolveItemCitations(
  payload: AnalysisPayload,
  chunks: RetrievedChunk[]
): AnalysisPayload {
  const byId = new Map(chunks.map((c) => [c.chunkId, c]));
  const locate = (row: Record<string, unknown>): Record<string, unknown> => {
    const ref = row.ref as string | null | undefined;
    const c = ref ? byId.get(ref) : undefined;
    return c ? { ...row, page: c.page ?? null, paragraph: c.paragraph ?? null } : row;
  };
  // Checklist/risk rows have no `ref`, so `locate` is a harmless no-op for them.
  if ("items" in payload) {
    const items = (payload.items as Record<string, unknown>[]).map(locate);
    return { items } as unknown as AnalysisPayload;
  }
  if ("sections" in payload) {
    const sections = (payload.sections as Record<string, unknown>[]).map(locate);
    return { sections } as unknown as AnalysisPayload;
  }
  return payload;
}

/**
 * Validation gate: a structurally-valid payload can still be empty (no items,
 * no section bodies). Treat those as "not found" so the UI can say so rather
 * than showing a hollow result.
 */
function isEmptyPayload(payload: AnalysisPayload): boolean {
  if ("items" in payload) return payload.items.length === 0;
  if ("risks" in payload) return payload.risks.length === 0;
  if ("sections" in payload) {
    return payload.sections.every((s) => !s.body || s.body.trim().length === 0);
  }
  return true;
}

/**
 * Run any registered analysis kind against a document's retrieved chunks.
 *
 * Uses the configured LLM (validated against the kind's Zod schema) when
 * available, and a deterministic, grounded fallback otherwise. Citations are
 * attached from the context so every result is traceable. Never fabricates.
 */
export async function runAnalysis(
  kind: AiResultKind,
  documentTitle: string,
  fullText: string,
  chunks: RetrievedChunk[]
): Promise<ModuleResult<AnalysisPayload>> {
  const def = getAnalysisDef(kind);
  if (!def) throw new Error(`No analysis definition for kind: ${kind}`);

  const llm = getLlmProvider();
  const context = chunks.slice(0, aiConfig.maxContextChunks);

  if (context.length === 0) {
    return {
      payload: def.fallback(documentTitle, fullText, []),
      citations: [],
      confidence: 0,
      provider: llm.name,
      model: llm.model,
      notFound: true,
    };
  }

  // ── Real LLM path ──────────────────────────────────────────────────────────
  if (llm.name !== "extractive" && llm.isReady()) {
    try {
      const completion = await llm.complete(
        [
          { role: "system", content: def.system },
          { role: "user", content: def.buildUser(documentTitle, context) },
        ],
        { json: true, temperature: 0.2, model: aiConfig.llm.premiumModel }
      );
      // Validation gate: schema (Zod) + non-empty payload + citation availability.
      const parsed = resolveItemCitations(def.schema.parse(JSON.parse(completion.text)), context);
      const citations = citationsFrom(context);
      const empty = isEmptyPayload(parsed);
      // Confidence reflects grounding: full when citations back a non-empty
      // result, reduced when citations are missing, floored when empty.
      const confidence = empty ? 0.2 : citations.length > 0 ? 0.7 : 0.5;

      return {
        payload: parsed,
        citations,
        confidence,
        provider: completion.provider,
        model: completion.model,
        tokensUsed: completion.tokensUsed,
        notFound: empty || confidence < aiConfig.minConfidence,
      };
    } catch (err) {
      console.warn(`[analysis:${kind}] LLM path failed, using fallback:`, err);
    }
  }

  // ── Deterministic fallback ───────────────────────────────────────────────────
  return {
    payload: def.fallback(documentTitle, fullText, context),
    citations: citationsFrom(context, 3),
    confidence: 0.4,
    provider: "extractive",
    model: "extractive-v1",
  };
}
