import "server-only";
import { processDocument } from "@/lib/ai/pipeline/process-document";
import { enqueue, registerHandler } from "@/lib/queue/db-queue";

/**
 * Queue abstraction for background AI work, backed by the durable MySQL job
 * queue (free/open-source, no Redis). `enqueueDocumentProcessing` persists a
 * job that the polling worker picks up, so work survives restarts and retries
 * on failure. `processInline` still runs synchronously for tests/small docs.
 */
export const DOCUMENT_PROCESS_JOB = "document.process";

// Register the handler once at module load (the worker imports this module).
registerHandler(DOCUMENT_PROCESS_JOB, async (payload) => {
  const documentId = payload.documentId as string;
  if (!documentId) throw new Error("document.process job missing documentId");
  await processDocument(documentId);
});

export interface JobQueue {
  enqueueDocumentProcessing(documentId: string): Promise<{ enqueued: boolean }>;
}

class DbBackedQueue implements JobQueue {
  async enqueueDocumentProcessing(documentId: string) {
    await enqueue(DOCUMENT_PROCESS_JOB, { documentId });
    return { enqueued: true };
  }
}

let queue: JobQueue | null = null;

export function getQueue(): JobQueue {
  if (!queue) queue = new DbBackedQueue();
  return queue;
}

/** Await full processing inline — useful for tests and small TXT documents. */
export async function processInline(documentId: string): Promise<void> {
  await processDocument(documentId);
}
