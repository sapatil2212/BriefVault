import type { RetrievedChunk } from "@/lib/ai/types";

/** Filters applied during semantic/hybrid search. */
export interface VectorSearchFilter {
  documentId?: string;
  documentIds?: string[];
  page?: number;
  /** Match chunks whose heading/section metadata contains this label. */
  section?: string;
}

export interface VectorSearchOptions {
  topK?: number;
  filter?: VectorSearchFilter;
  /** Blend lexical overlap with vector similarity (0 = pure vector). */
  hybridWeight?: number;
  /** Raw query text — required when hybridWeight > 0 for lexical scoring. */
  queryText?: string;
}

export interface UpsertVector {
  chunkId: string;
  documentId: string;
  vector: number[];
  provider: string;
  model: string;
  content: string;
  heading?: string | null;
  page?: number | null;
  paragraph?: number | null;
}

/**
 * Provider-agnostic vector database contract. The default implementation is
 * DB-backed; Pinecone/Qdrant/Weaviate/Milvus implement the same interface so
 * the rest of the engine is unaffected by the choice.
 */
export interface VectorStore {
  readonly name: string;
  saveEmbedding(vec: UpsertVector): Promise<void>;
  saveEmbeddings(vecs: UpsertVector[]): Promise<void>;
  searchSimilar(
    query: number[],
    options?: VectorSearchOptions
  ): Promise<RetrievedChunk[]>;
  updateEmbedding(vec: UpsertVector): Promise<void>;
  deleteEmbedding(chunkId: string): Promise<void>;
  deleteByDocument(documentId: string): Promise<void>;
}
