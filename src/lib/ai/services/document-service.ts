import "server-only";
import { prisma } from "@/lib/prisma";
import { extractText, detectKind, UnsupportedFormatError } from "@/lib/ai/extraction";
import { getQueue, processInline } from "@/lib/ai/queue";
import { uploadFile, assertWithinSizeLimit, getStorageProvider } from "@/lib/storage";
import type { ProcessDocumentInput } from "@/lib/validations/document";

/**
 * Application service for the document lifecycle. Keeps all business logic out
 * of route handlers (which only parse/authorize and shape responses).
 */

/**
 * Create a document from supplied text, persist the original bytes to storage,
 * run extraction, then either process inline (sync) or enqueue background work.
 */
export async function createAndProcessDocument(
  userId: string,
  input: ProcessDocumentInput
) {
  const buffer = Buffer.from(input.text, "utf-8");
  assertWithinSizeLimit(buffer.byteLength);

  const extraction = await extractText({
    buffer,
    text: input.text,
    mimeType: input.mimeType,
    fileName: input.fileName,
  });

  // Persist the raw file so the original is always retrievable.
  const stored = await uploadFile(
    userId,
    input.fileName ?? `${input.title}.txt`,
    buffer,
    input.mimeType ?? "text/plain"
  );

  const doc = await prisma.document.create({
    data: {
      userId,
      title: input.title,
      kind: detectKind({ buffer, text: input.text, mimeType: input.mimeType, fileName: input.fileName }),
      status: "UPLOADED",
      mimeType: input.mimeType ?? "text/plain",
      sizeBytes: buffer.byteLength,
      pageCount: extraction.pageCount,
      language: extraction.language,
      rawText: extraction.text,
      storageKey: stored.key,
      storageUrl: stored.url,
      folderId: input.folderId ?? null,
    },
  });

  if (input.sync) {
    await processInline(doc.id);
  } else {
    await getQueue().enqueueDocumentProcessing(doc.id);
  }

  return prisma.document.findUnique({
    where: { id: doc.id },
    include: { metadata: true, results: true },
  });
}

/**
 * Create a document from an uploaded binary file. The file is always stored;
 * text extraction runs only for supported types (Phase 1: plain text). For
 * unsupported types the document is retained in UPLOADED state with a note, so
 * the file is preserved for a future extractor/OCR pass.
 */
export async function createDocumentFromUpload(
  userId: string,
  file: { fileName: string; mimeType: string; buffer: Buffer; title?: string; folderId?: string | null; sync?: boolean }
) {
  assertWithinSizeLimit(file.buffer.byteLength);

  const stored = await uploadFile(userId, file.fileName, file.buffer, file.mimeType);
  const kind = detectKind({ buffer: file.buffer, mimeType: file.mimeType, fileName: file.fileName });

  let extractedText: string | null = null;
  let pageCount: number | null = null;
  let language: string | null = null;
  let unsupportedNote: string | null = null;

  try {
    const extraction = await extractText({
      buffer: file.buffer,
      mimeType: file.mimeType,
      fileName: file.fileName,
    });
    extractedText = extraction.text;
    pageCount = extraction.pageCount;
    language = extraction.language ?? null;
  } catch (err) {
    if (err instanceof UnsupportedFormatError) {
      unsupportedNote = err.message;
    } else {
      throw err;
    }
  }

  const doc = await prisma.document.create({
    data: {
      userId,
      title: file.title?.trim() || file.fileName,
      kind,
      status: "UPLOADED",
      mimeType: file.mimeType,
      sizeBytes: file.buffer.byteLength,
      pageCount,
      language,
      rawText: extractedText,
      storageKey: stored.key,
      storageUrl: stored.url,
      errorMessage: unsupportedNote,
      folderId: file.folderId ?? null,
    },
  });

  // Only run the pipeline when we actually have text to work with.
  if (extractedText) {
    if (file.sync) await processInline(doc.id);
    else await getQueue().enqueueDocumentProcessing(doc.id);
  }

  return prisma.document.findUnique({
    where: { id: doc.id },
    include: { metadata: true, results: true },
  });
}

/** Processing status with per-stage job breakdown. */
export async function getProcessingStatus(userId: string, documentId: string) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId, deletedAt: null },
    include: {
      jobs: { orderBy: { createdAt: "asc" } },
      _count: { select: { chunks: true, results: true } },
    },
  });
  if (!doc) return null;

  return {
    id: doc.id,
    title: doc.title,
    status: doc.status,
    kind: doc.kind,
    pageCount: doc.pageCount,
    errorMessage: doc.errorMessage,
    chunks: doc._count.chunks,
    results: doc._count.results,
    stages: doc.jobs.map((j) => ({
      stage: j.stage,
      status: j.status,
      error: j.error,
      startedAt: j.startedAt,
      finishedAt: j.finishedAt,
    })),
  };
}

/** All structured AI results + metadata for a ready document. */
export async function getDocumentResults(userId: string, documentId: string) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId, deletedAt: null },
    include: { metadata: true, results: true },
  });
  if (!doc) return null;

  // Expose an authenticated, same-origin URL for the stored PDF (viewer).
  const pdfUrl =
    doc.kind === "PDF" && doc.storageKey
      ? `/api/storage/${doc.storageKey.split("/").map(encodeURIComponent).join("/")}`
      : null;

  return {
    id: doc.id,
    title: doc.title,
    status: doc.status,
    kind: doc.kind,
    language: doc.language,
    pageCount: doc.pageCount,
    sizeBytes: doc.sizeBytes,
    pdfUrl,
    metadata: doc.metadata,
    results: doc.results.map((r) => ({
      kind: r.kind,
      payload: r.payload,
      citations: r.citations,
      confidence: r.confidence,
      provider: r.provider,
      model: r.model,
      updatedAt: r.updatedAt,
    })),
  };
}

/** Fetch a user's document row (auth-scoped) or null. */
export async function getOwnedDocument(userId: string, documentId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, userId, deletedAt: null },
  });
}

/** Rename a document (auth-scoped). Returns false if not found. */
export async function renameDocument(userId: string, documentId: string, title: string) {
  const doc = await getOwnedDocument(userId, documentId);
  if (!doc) return false;
  await prisma.document.update({
    where: { id: documentId },
    data: { title: title.trim() },
  });
  return true;
}

/** Paginated list of a user's documents, newest first. */
export async function listDocuments(
  userId: string,
  opts: { take?: number; cursor?: string } = {}
) {
  const take = Math.min(Math.max(opts.take ?? 20, 1), 100);
  const rows = await prisma.document.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    include: {
      metadata: { select: { court: true, caseNumber: true } },
      _count: { select: { results: true } },
    },
  });

  const hasMore = rows.length > take;
  const items = (hasMore ? rows.slice(0, take) : rows).map((d) => ({
    id: d.id,
    title: d.title,
    kind: d.kind,
    status: d.status,
    sizeBytes: d.sizeBytes,
    pageCount: d.pageCount,
    resultCount: d._count.results,
    court: d.metadata?.court ?? null,
    caseNumber: d.metadata?.caseNumber ?? null,
    createdAt: d.createdAt,
  }));

  return { items, nextCursor: hasMore ? items[items.length - 1]?.id : null };
}

/** Documents that have a generated executive summary, newest first. */
export async function listSummaries(userId: string) {
  const rows = await prisma.aiResult.findMany({
    where: { kind: "EXECUTIVE_SUMMARY", document: { userId, deletedAt: null } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { document: { select: { id: true, title: true, status: true } } },
  });

  return rows.map((r) => {
    const payload = r.payload as { overview?: string | null; readingTimeSavedMinutes?: number } | null;
    return {
      documentId: r.documentId,
      title: r.document.title,
      overview: payload?.overview ?? null,
      readingTimeSavedMinutes: payload?.readingTimeSavedMinutes ?? 0,
      confidence: r.confidence,
      provider: r.provider,
      updatedAt: r.updatedAt,
    };
  });
}

/** IDs of a user's non-deleted, processed documents (for RAG scoping). */
export async function getUserDocumentIds(userId: string): Promise<string[]> {
  const rows = await prisma.document.findMany({
    where: { userId, deletedAt: null, status: "READY" },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** Soft-delete a document (auth-scoped). Returns false if not found. */
export async function softDeleteDocument(userId: string, documentId: string) {
  const doc = await getOwnedDocument(userId, documentId);
  if (!doc) return false;
  await prisma.document.update({
    where: { id: documentId },
    data: { deletedAt: new Date() },
  });
  return true;
}

/** Soft-deleted documents (Trash), most-recently-deleted first. */
export async function listTrashedDocuments(userId: string) {
  const rows = await prisma.document.findMany({
    where: { userId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    take: 100,
    include: { _count: { select: { results: true } } },
  });
  return rows.map((d) => ({
    id: d.id,
    title: d.title,
    kind: d.kind,
    status: d.status,
    sizeBytes: d.sizeBytes,
    resultCount: d._count.results,
    deletedAt: d.deletedAt,
    createdAt: d.createdAt,
  }));
}

/** Restore a soft-deleted document. Returns false if not found in trash. */
export async function restoreDocument(userId: string, documentId: string) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId, deletedAt: { not: null } },
  });
  if (!doc) return false;
  await prisma.document.update({
    where: { id: documentId },
    data: { deletedAt: null },
  });
  return true;
}

/**
 * Permanently delete a document and its derived data. Chunks, embeddings, AI
 * results, jobs and reports are removed via cascade; the stored file is cleaned
 * up best-effort. Returns false if the document isn't owned by the user.
 */
export async function permanentlyDeleteDocument(userId: string, documentId: string) {
  const doc = await prisma.document.findFirst({ where: { id: documentId, userId } });
  if (!doc) return false;

  if (doc.storageKey) {
    try {
      await getStorageProvider().delete(doc.storageKey);
    } catch {
      // Best-effort: a missing/unreachable object shouldn't block DB cleanup.
    }
  }

  await prisma.document.delete({ where: { id: documentId } });
  return true;
}

type ListItem = { title: string; detail?: string | null; tag?: string | null };

/** Extract `list`-shaped items from an AI result payload, tolerating shape drift. */
function payloadItems(payload: unknown): ListItem[] {
  const items = (payload as { items?: unknown } | null)?.items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((it): it is ListItem => !!it && typeof (it as ListItem).title === "string")
    .map((it) => ({ title: it.title, detail: it.detail ?? null, tag: it.tag ?? null }));
}

/**
 * Case Law Finder data: every cited judgment/precedent the AI extracted across
 * the user's documents (from CASE_CITATIONS results), plus the documents that
 * are themselves judgments (metadata carries a court).
 */
export async function getCaseLawData(userId: string) {
  const scope = { userId, deletedAt: null } as const;

  const [citationRows, judgmentRows] = await Promise.all([
    prisma.aiResult.findMany({
      where: { kind: "CASE_CITATIONS", document: scope },
      orderBy: { updatedAt: "desc" },
      include: { document: { select: { id: true, title: true } } },
    }),
    prisma.document.findMany({
      where: { ...scope, metadata: { court: { not: null } } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        metadata: {
          select: { court: true, caseNumber: true, judge: true, decisionDate: true },
        },
      },
    }),
  ]);

  const citations = citationRows.flatMap((r) =>
    payloadItems(r.payload).map((it) => ({
      documentId: r.document.id,
      documentTitle: r.document.title,
      title: it.title,
      detail: it.detail ?? null,
      tag: it.tag ?? null,
    }))
  );

  const judgments = judgmentRows.map((d) => ({
    id: d.id,
    title: d.title,
    court: d.metadata?.court ?? null,
    caseNumber: d.metadata?.caseNumber ?? null,
    judge: d.metadata?.judge ?? null,
    decisionDate: d.metadata?.decisionDate ?? null,
  }));

  return { citations, judgments };
}

/**
 * Saved Insights data: every AI-extracted insight across the user's documents
 * (all result kinds except the executive summary, which has its own page).
 */
export async function getExtractedInsights(userId: string) {
  const rows = await prisma.aiResult.findMany({
    where: {
      document: { userId, deletedAt: null },
      kind: { not: "EXECUTIVE_SUMMARY" },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { document: { select: { id: true, title: true } } },
  });

  return rows.map((r) => {
    const payload = r.payload as
      | { items?: unknown[]; sections?: unknown[]; risks?: unknown[] }
      | null;
    const itemCount =
      (Array.isArray(payload?.items) ? payload!.items.length : 0) +
      (Array.isArray(payload?.sections) ? payload!.sections.length : 0) +
      (Array.isArray(payload?.risks) ? payload!.risks.length : 0);
    return {
      documentId: r.document.id,
      documentTitle: r.document.title,
      kind: r.kind as string,
      confidence: r.confidence,
      itemCount,
      updatedAt: r.updatedAt,
    };
  });
}
