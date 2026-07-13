import "server-only";
import { aiConfig } from "@/lib/ai/config";
import type { VectorStore } from "./types";
import { DbVectorStore } from "./db-store";

export type {
  VectorStore,
  VectorSearchOptions,
  VectorSearchFilter,
  UpsertVector,
} from "./types";

let cached: VectorStore | null = null;

/**
 * Resolve the active vector store. Only the DB store ships in Phase 1; the
 * Pinecone/Qdrant/Weaviate cases are wired to fall back to it until their
 * clients are added, so callers never break.
 */
export function getVectorStore(): VectorStore {
  if (cached) return cached;

  switch (aiConfig.vector.store) {
    case "pinecone":
    case "qdrant":
    case "weaviate":
    // TODO: implement dedicated clients; same VectorStore interface.
    case "db":
    default:
      cached = new DbVectorStore();
  }

  return cached;
}

export function resetVectorStore(): void {
  cached = null;
}
