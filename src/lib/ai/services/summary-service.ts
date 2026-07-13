import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateExecutiveSummary } from "@/lib/ai/modules/executive-summary";
import { logAiRequest } from "@/lib/ai/logging";
import type { RetrievedChunk } from "@/lib/ai/types";

/**
 * Return the Executive Summary for a document, reusing the cached result unless
 * `force` is set. Avoids redundant AI calls (and cost) by default.
 */
export async function getOrCreateExecutiveSummary(
  documentId: string,
  force = false
) {
  if (!force) {
    const existing = await prisma.aiResult.findUnique({
      where: { documentId_kind: { documentId, kind: "EXECUTIVE_SUMMARY" } },
    });
    if (existing) {
      return { cached: true, result: existing };
    }
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      chunks: { orderBy: { index: "asc" } },
    },
  });
  if (!doc) throw new Error("Document not found");
  if (doc.chunks.length === 0) {
    throw new Error("Document has not been processed yet");
  }

  const retrieved: RetrievedChunk[] = doc.chunks.map((c) => ({
    chunkId: c.id,
    documentId,
    content: c.content,
    heading: c.heading,
    page: c.pageNumber,
    paragraph: c.paragraphNo,
    score: 1,
  }));

  const startedAt = Date.now();
  const summary = await generateExecutiveSummary(
    doc.title,
    doc.cleanedText ?? doc.rawText ?? "",
    retrieved
  );
  await logAiRequest({
    userId: doc.userId,
    documentId,
    kind: "EXECUTIVE_SUMMARY",
    provider: summary.provider,
    model: summary.model,
    tokensUsed: summary.tokensUsed,
    latencyMs: Date.now() - startedAt,
    confidence: summary.confidence,
    success: !summary.notFound,
  });

  const payload = summary.payload as unknown as Prisma.InputJsonValue;
  const citations = summary.citations as unknown as Prisma.InputJsonValue;
  const result = await prisma.aiResult.upsert({
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

  return { cached: false, result };
}
