import "server-only";
import { prisma } from "@/lib/prisma";
import type { RetrievedChunk } from "@/lib/ai/types";
import type {
  UpsertVector,
  VectorSearchOptions,
  VectorStore,
} from "./types";

/** Cosine similarity between two equal-length vectors. */
function cosine(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** Lexical overlap score (Jaccard over word sets) for hybrid search. */
function lexicalOverlap(query: string, text: string): number {
  const qWords = new Set(query.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
  if (qWords.size === 0) return 0;
  const tWords = new Set(text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
  let inter = 0;
  for (const w of qWords) if (tWords.has(w)) inter++;
  return inter / qWords.size;
}

/**
 * Default DB-backed vector store. Vectors are persisted in the
 * `document_embeddings` table and similarity is computed in-process.
 *
 * This is intentionally simple and correct for small/medium corpora and local
 * development. For large-scale production, implement the same {@link VectorStore}
 * interface against Pinecone/Qdrant/Weaviate and select it via AI_VECTOR_STORE.
 */
export class DbVectorStore implements VectorStore {
  readonly name = "db";

  async saveEmbedding(vec: UpsertVector): Promise<void> {
    await prisma.documentEmbedding.upsert({
      where: { chunkId: vec.chunkId },
      create: {
        chunkId: vec.chunkId,
        documentId: vec.documentId,
        provider: vec.provider,
        model: vec.model,
        dimensions: vec.vector.length,
        vector: vec.vector,
      },
      update: {
        provider: vec.provider,
        model: vec.model,
        dimensions: vec.vector.length,
        vector: vec.vector,
      },
    });
  }

  async saveEmbeddings(vecs: UpsertVector[]): Promise<void> {
    // Sequential upserts keep memory flat; batch sizes here are small per doc.
    for (const vec of vecs) await this.saveEmbedding(vec);
  }

  async updateEmbedding(vec: UpsertVector): Promise<void> {
    await this.saveEmbedding(vec);
  }

  async deleteEmbedding(chunkId: string): Promise<void> {
    await prisma.documentEmbedding
      .delete({ where: { chunkId } })
      .catch(() => undefined);
  }

  async deleteByDocument(documentId: string): Promise<void> {
    await prisma.documentEmbedding.deleteMany({ where: { documentId } });
  }

  async searchSimilar(
    query: number[],
    options: VectorSearchOptions = {}
  ): Promise<RetrievedChunk[]> {
    const topK = options.topK ?? 8;
    const filter = options.filter ?? {};
    const hybridWeight = options.hybridWeight ?? 0;

    const documentIds =
      filter.documentIds ?? (filter.documentId ? [filter.documentId] : undefined);

    const rows = await prisma.documentEmbedding.findMany({
      where: documentIds ? { documentId: { in: documentIds } } : {},
      include: { chunk: true },
    });

    const scored = rows
      .filter((row) => {
        if (filter.page != null && row.chunk.pageNumber !== filter.page) return false;
        if (
          filter.section &&
          !(row.chunk.heading ?? "").toLowerCase().includes(filter.section.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .map((row) => {
        const vec = row.vector as number[];
        const sim = cosine(query, vec);
        const lexical =
          hybridWeight > 0 && options.queryText
            ? lexicalOverlap(options.queryText, row.chunk.content)
            : 0;
        const score =
          hybridWeight > 0
            ? (1 - hybridWeight) * sim + hybridWeight * lexical
            : sim;
        return { row, score, sim };
      });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map(({ row, score }) => ({
      chunkId: row.chunkId,
      documentId: row.documentId,
      content: row.chunk.content,
      heading: row.chunk.heading,
      page: row.chunk.pageNumber,
      paragraph: row.chunk.paragraphNo,
      score,
    }));
  }
}
