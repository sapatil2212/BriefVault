import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma, type AiResultKind } from "@prisma/client";
import { aiConfig } from "@/lib/ai/config";
import { runAnalysis } from "@/lib/ai/analysis/engine";
import { getOrCreateExecutiveSummary } from "@/lib/ai/services/summary-service";
import { getEmbeddingProvider } from "@/lib/ai/providers/embeddings";
import { getVectorStore } from "@/lib/ai/vector";
import { logAiRequest } from "@/lib/ai/logging";
import type { RetrievedChunk } from "@/lib/ai/types";

/**
 * Focused modules retrieve the most relevant chunks via semantic search using
 * these queries (true per-module RAG). Broad modules (whole-document summaries)
 * are omitted and fall back to representative sampling for full coverage.
 */
const RETRIEVAL_QUERIES: Partial<Record<AiResultKind, string>> = {
  TIMELINE: "chronological timeline dates events sequence order",
  DEADLINES: "deadline due date effective filing hearing compliance date",
  CASE_CITATIONS: "cited case judgment precedent citation reported versus",
  SECTIONS_OF_LAW: "section article act rule regulation notification clause",
  ARGUMENTS: "petitioner respondent counsel argued submission contended",
  FINAL_DECISION: "held decision ordered dismissed allowed relief directed",
  RATIO_DECIDENDI: "held principle reasoning ratio because therefore accordingly",
  QUESTIONS_BEFORE_COURT: "issue question whether the court considered for determination",
  CASE_FACTS: "facts background events dispute evidence circumstances",
  RISK_ANALYSIS: "risk penalty liability non-compliance exposure default",
  MONETARY_INFO: "amount penalty tax refund compensation fine damages rupees",
  ACTION_ITEMS: "must shall required to comply action ensure file",
  KEY_HIGHLIGHTS: "important change new rule penalty clarification amendment",
  IMPORTANT_PARAGRAPHS: "significant important key paragraph crucial",
  OBITER_DICTA: "observation remark noted incidentally opinion",
  COMPLIANCE_CHECKLIST: "shall must required obligation comply within days",
};

/**
 * Retrieve the context chunks for an analysis kind. Focused kinds use semantic
 * (hybrid) vector retrieval; everything else uses an evenly-spaced sample that
 * covers the whole document. Falls back to sampling when retrieval is sparse.
 */
async function retrieveContext(
  documentId: string,
  kind: AiResultKind,
  allChunks: { id: string; content: string; heading: string | null; pageNumber: number | null; paragraphNo: number | null }[]
): Promise<RetrievedChunk[]> {
  const sample = (): RetrievedChunk[] =>
    pickRepresentative(allChunks, 10).map((c) => ({
      chunkId: c.id,
      documentId,
      content: c.content,
      heading: c.heading,
      page: c.pageNumber,
      paragraph: c.paragraphNo,
      score: 1,
    }));

  const query = RETRIEVAL_QUERIES[kind];
  if (!query) return sample();

  try {
    const embedder = getEmbeddingProvider();
    const { vector } = await embedder.embed(query);
    const hits = await getVectorStore().searchSimilar(vector, {
      topK: aiConfig.maxContextChunks,
      filter: { documentId },
      hybridWeight: 0.3,
      queryText: query,
    });
    // Fall back to sampling when the index is empty/sparse for this document.
    return hits.length >= 3 ? hits : sample();
  } catch (err) {
    console.warn(`[analysis:${kind}] retrieval failed, sampling instead:`, err);
    return sample();
  }
}

/**
 * Return an analysis result for a document, generating and caching it on first
 * request. `EXECUTIVE_SUMMARY` delegates to its dedicated richer module; all
 * other kinds run through the generic analysis engine.
 */
export async function getOrCreateAnalysis(
  documentId: string,
  kind: AiResultKind,
  force = false
) {
  if (kind === "EXECUTIVE_SUMMARY") {
    const { result } = await getOrCreateExecutiveSummary(documentId, force);
    return result;
  }

  if (!force) {
    const existing = await prisma.aiResult.findUnique({
      where: { documentId_kind: { documentId, kind } },
    });
    if (existing) return existing;
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { chunks: { orderBy: { index: "asc" } } },
  });
  if (!doc) throw new Error("Document not found");
  if (doc.chunks.length === 0) throw new Error("Document has not been processed yet");

  // Per-module RAG: retrieve the most relevant chunks (focused kinds) or an
  // evenly-spaced representative sample (broad summaries).
  const retrieved = await retrieveContext(documentId, kind, doc.chunks);

  const startedAt = Date.now();
  const result = await runAnalysis(
    kind,
    doc.title,
    doc.cleanedText ?? doc.rawText ?? "",
    retrieved
  );
  await logAiRequest({
    userId: doc.userId,
    documentId,
    kind,
    provider: result.provider,
    model: result.model,
    tokensUsed: result.tokensUsed,
    latencyMs: Date.now() - startedAt,
    confidence: result.confidence,
    success: !result.notFound,
  });

  const payload = result.payload as unknown as Prisma.InputJsonValue;
  const citations = result.citations as unknown as Prisma.InputJsonValue;

  return prisma.aiResult.upsert({
    where: { documentId_kind: { documentId, kind } },
    create: {
      documentId,
      kind,
      payload,
      citations,
      confidence: result.confidence,
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
    },
    update: {
      payload,
      citations,
      confidence: result.confidence,
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
    },
  });
}

function pickRepresentative<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const step = items.length / n;
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(items[Math.floor(i * step)]);
  return out;
}
