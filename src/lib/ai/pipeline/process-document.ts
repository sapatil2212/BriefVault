import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma, type ProcessingStage } from "@prisma/client";
import { cleanText, detectLanguage } from "@/lib/ai/processing/clean";
import { extractMetadata } from "@/lib/ai/processing/metadata";
import { chunkDocument } from "@/lib/ai/processing/chunk";
import { getEmbeddingProvider } from "@/lib/ai/providers/embeddings";
import { getVectorStore, type UpsertVector } from "@/lib/ai/vector";
import { generateExecutiveSummary } from "@/lib/ai/modules/executive-summary";
import { getOrCreateAnalysis } from "@/lib/ai/services/analysis-service";
import { createNotification } from "@/lib/notifications/service";
import type { AiResultKind } from "@prisma/client";
import type { RetrievedChunk } from "@/lib/ai/types";

/**
 * Analysis modules generated automatically after the executive summary, so the
 * Insights, Case Law and related views are populated without manual triggering.
 * Each runs best-effort — a single module failing never fails the document.
 */
const DEFAULT_ANALYSES: AiResultKind[] = [
  "KEY_HIGHLIGHTS",
  "TIMELINE",
  "SECTIONS_OF_LAW",
  "CASE_CITATIONS",
  "RISK_ANALYSIS",
  "ACTION_ITEMS",
  "DEADLINES",
];

/**
 * Run a single named stage, recording its lifecycle in `processing_jobs`.
 * A stage failure marks the job FAILED and rethrows so the caller can fail the
 * document — each stage remains independently observable and retryable.
 */
async function runStage<T>(
  documentId: string,
  stage: ProcessingStage,
  fn: () => Promise<T>
): Promise<T> {
  const job = await prisma.processingJob.create({
    data: { documentId, stage, status: "RUNNING", startedAt: new Date(), attempts: 1 },
  });
  try {
    const result = await fn();
    await prisma.processingJob.update({
      where: { id: job.id },
      data: { status: "SUCCEEDED", finishedAt: new Date() },
    });
    return result;
  } catch (err) {
    await prisma.processingJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

/**
 * Execute the full document intelligence pipeline for a document that already
 * has `rawText` populated. Stages run in order and are individually replaceable:
 *
 *   CLEANING → METADATA → CHUNKING → EMBEDDING → INDEXING → ANALYSIS
 *
 * On success the document transitions to READY; any stage error marks it FAILED
 * with a message. Existing chunks/embeddings are cleared first to make the run
 * idempotent (safe to re-process).
 */
export async function processDocument(documentId: string): Promise<void> {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error(`Document ${documentId} not found`);
  if (!doc.rawText || doc.rawText.trim().length === 0) {
    throw new Error("Document has no extracted text to process");
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "PROCESSING", errorMessage: null },
  });

  try {
    // Idempotency: clear prior derived data.
    await getVectorStore().deleteByDocument(documentId);
    await prisma.documentChunk.deleteMany({ where: { documentId } });

    // 1. Cleaning
    const cleaned = await runStage(documentId, "CLEANING", async () => {
      const text = cleanText(doc.rawText!);
      await prisma.document.update({
        where: { id: documentId },
        data: { cleanedText: text, language: detectLanguage(text) },
      });
      return text;
    });

    // 2. Metadata (stored separately)
    await runStage(documentId, "METADATA", async () => {
      const meta = extractMetadata(cleaned);
      await prisma.documentMetadata.upsert({
        where: { documentId },
        create: {
          documentId,
          documentTitle: meta.documentTitle,
          court: meta.court,
          authority: meta.authority,
          judge: meta.judge,
          caseNumber: meta.caseNumber,
          parties: meta.parties ?? undefined,
          decisionDate: meta.decisionDate ? new Date(meta.decisionDate) : null,
          notificationNumber: meta.notificationNumber,
          circularNumber: meta.circularNumber,
          acts: meta.acts,
          sections: meta.sections,
          regulations: meta.regulations,
          keywords: meta.keywords,
          confidence: meta.confidence,
        },
        update: {
          documentTitle: meta.documentTitle,
          court: meta.court,
          authority: meta.authority,
          judge: meta.judge,
          caseNumber: meta.caseNumber,
          parties: meta.parties ?? undefined,
          decisionDate: meta.decisionDate ? new Date(meta.decisionDate) : null,
          notificationNumber: meta.notificationNumber,
          circularNumber: meta.circularNumber,
          acts: meta.acts,
          sections: meta.sections,
          regulations: meta.regulations,
          keywords: meta.keywords,
          confidence: meta.confidence,
        },
      });
    });

    // 3. Chunking — reconstruct pages from cleaned text (single logical stream).
    const chunkIds = await runStage(documentId, "CHUNKING", async () => {
      const drafts = chunkDocument([{ page: doc.pageCount ?? 1, text: cleaned }]);
      const created: { id: string; content: string; heading: string | null; page: number | null; paragraph: number | null }[] = [];
      for (const d of drafts) {
        const row = await prisma.documentChunk.create({
          data: {
            documentId,
            index: d.index,
            content: d.content,
            heading: d.heading,
            pageNumber: d.pageNumber,
            paragraphNo: d.paragraphNo,
            tokenCount: d.tokenCount,
            metadata: d.metadata,
          },
        });
        created.push({
          id: row.id,
          content: row.content,
          heading: row.heading,
          page: row.pageNumber,
          paragraph: row.paragraphNo,
        });
      }
      return created;
    });

    // 4. Embedding
    const embedder = getEmbeddingProvider();
    const embeddings = await runStage(documentId, "EMBEDDING", async () => {
      const results = await embedder.embedBatch(chunkIds.map((c) => c.content));
      return results;
    });

    // 5. Indexing (vector store)
    await runStage(documentId, "INDEXING", async () => {
      const upserts: UpsertVector[] = chunkIds.map((c, i) => ({
        chunkId: c.id,
        documentId,
        vector: embeddings[i].vector,
        provider: embeddings[i].provider,
        model: embeddings[i].model,
        content: c.content,
        heading: c.heading,
        page: c.page,
        paragraph: c.paragraph,
      }));
      await getVectorStore().saveEmbeddings(upserts);
    });

    // 6. Analysis — Executive Summary (first module). Uses a representative,
    //    evenly-spaced sample of chunks so long docs stay within the budget.
    await runStage(documentId, "ANALYSIS", async () => {
      const sample = pickRepresentative(chunkIds, 8);
      const retrieved: RetrievedChunk[] = sample.map((c) => ({
        chunkId: c.id,
        documentId,
        content: c.content,
        heading: c.heading,
        page: c.page,
        paragraph: c.paragraph,
        score: 1,
      }));

      const summary = await generateExecutiveSummary(doc.title, cleaned, retrieved);
      const payload = summary.payload as unknown as Prisma.InputJsonValue;
      const citations = summary.citations as unknown as Prisma.InputJsonValue;
      await prisma.aiResult.upsert({
        where: { documentId_kind: { documentId, kind: "EXECUTIVE_SUMMARY" } },
        create: {
          documentId,
          kind: "EXECUTIVE_SUMMARY",
          payload,
          citations,
          confidence: summary.confidence,
          provider: summary.provider,
          model: summary.model,
          tokensUsed: summary.tokensUsed,
        },
        update: {
          payload,
          citations,
          confidence: summary.confidence,
          provider: summary.provider,
          model: summary.model,
          tokensUsed: summary.tokensUsed,
        },
      });
    });

    // 7. Auto-generate the default analysis modules (best-effort) with bounded
    //    concurrency, so they run in parallel without overwhelming the provider.
    //    Populates Insights / Case Law / compliance views without manual clicks.
    const ANALYSIS_CONCURRENCY = 3;
    let cursor = 0;
    const worker = async () => {
      while (cursor < DEFAULT_ANALYSES.length) {
        const kind = DEFAULT_ANALYSES[cursor++];
        try {
          await getOrCreateAnalysis(documentId, kind);
        } catch (e) {
          console.warn(`[pipeline] analysis ${kind} failed for ${documentId}:`, e);
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(ANALYSIS_CONCURRENCY, DEFAULT_ANALYSES.length) }, worker)
    );

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "READY" },
    });

    await createNotification({
      userId: doc.userId,
      type: "DOCUMENT_READY",
      title: "Document ready",
      body: `"${doc.title}" has been processed and analyzed.`,
      link: `/dashboard/documents/${documentId}`,
    }).catch(() => undefined);
  } catch (err) {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });

    await createNotification({
      userId: doc.userId,
      type: "DOCUMENT_FAILED",
      title: "Processing failed",
      body: `"${doc.title}" could not be processed: ${
        err instanceof Error ? err.message : "Unknown error"
      }`,
      link: `/dashboard/documents/${documentId}`,
    }).catch(() => undefined);

    throw err;
  }
}

/** Pick up to `n` evenly-spaced items to cover the whole document. */
function pickRepresentative<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const step = items.length / n;
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(items[Math.floor(i * step)]);
  return out;
}
