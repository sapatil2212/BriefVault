import { createHash } from "crypto";
import { aiConfig } from "@/lib/ai/config";
import type { EmbeddingProvider, EmbeddingResult } from "./types";

/**
 * Deterministic, dependency-free embedding provider used as the offline
 * default. Implements the "hashing trick": each token is hashed into a bucket
 * and accumulated, then the vector is L2-normalized.
 *
 * It is NOT semantically as strong as a neural embedding model, but it is
 * stable, fast, and good enough for lexical similarity in development/tests.
 * Swap to the OpenAI/Gemini provider in production via AI_EMBEDDING_PROVIDER.
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  readonly name = "local";
  readonly model = "hashing-trick-v1";
  readonly dimensions = aiConfig.embeddings.dimensions;

  isReady(): boolean {
    return true;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const vector = new Array<number>(this.dimensions).fill(0);
    const tokens = text.toLowerCase().match(/[a-z0-9][a-z0-9'-]{1,}/g) ?? [];

    for (const token of tokens) {
      const hash = createHash("md5").update(token).digest();
      const bucket = hash.readUInt32BE(0) % this.dimensions;
      // Sign from a second slice keeps positive/negative contributions balanced.
      const sign = (hash.readUInt8(4) & 1) === 0 ? 1 : -1;
      vector[bucket] += sign;
    }

    // L2 normalize so cosine similarity is well-behaved.
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    for (let i = 0; i < vector.length; i++) vector[i] /= norm;

    return {
      vector,
      dimensions: this.dimensions,
      provider: this.name,
      model: this.model,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
