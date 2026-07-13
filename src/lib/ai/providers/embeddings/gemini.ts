import "server-only";
import { aiConfig } from "@/lib/ai/config";
import type { EmbeddingProvider, EmbeddingResult } from "./types";

/**
 * Google Gemini embeddings via the Generative Language REST API (no SDK).
 * Uses `embedContent` / `batchEmbedContents` and honors AI_EMBEDDING_DIMENSIONS
 * through the model's `outputDimensionality` parameter.
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  /** Max requests per batchEmbedContents call, per the Gemini API limit. */
  private static readonly MAX_BATCH = 100;
  /** Number of sub-batch calls to run in parallel for large documents. */
  private static readonly CONCURRENCY = 4;

  readonly name = "gemini";
  readonly model = aiConfig.embeddings.model;
  readonly dimensions = aiConfig.embeddings.dimensions;

  isReady(): boolean {
    return Boolean(aiConfig.llm.geminiApiKey);
  }

  /** Gemini expects the model id prefixed with `models/`. */
  private get modelPath(): string {
    return this.model.startsWith("models/") ? this.model : `models/${this.model}`;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.isReady()) {
      throw new Error("Gemini embeddings not configured (missing GEMINI_API_KEY).");
    }

    const url = `${aiConfig.llm.geminiBaseUrl}/${this.modelPath}:embedContent?key=${aiConfig.llm.geminiApiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.modelPath,
        content: { parts: [{ text }] },
        outputDimensionality: this.dimensions,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`Gemini embeddings failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const json = (await res.json()) as { embedding?: { values?: number[] } };
    return {
      vector: json.embedding?.values ?? [],
      dimensions: this.dimensions,
      provider: this.name,
      model: this.model,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];
    if (!this.isReady()) {
      throw new Error("Gemini embeddings not configured (missing GEMINI_API_KEY).");
    }

    // Gemini's batchEmbedContents accepts at most 100 requests per call. Split
    // into sub-batches and run them with bounded concurrency, preserving order.
    const { MAX_BATCH, CONCURRENCY } = GeminiEmbeddingProvider;
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += MAX_BATCH) {
      batches.push(texts.slice(i, i + MAX_BATCH));
    }

    const results: EmbeddingResult[][] = new Array(batches.length);
    let next = 0;
    const worker = async () => {
      while (true) {
        const idx = next++;
        if (idx >= batches.length) break;
        results[idx] = await this.embedChunk(batches[idx]);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, batches.length) }, worker)
    );

    return results.flat();
  }

  /** Embed a single sub-batch (≤ MAX_BATCH texts) via batchEmbedContents. */
  private async embedChunk(texts: string[]): Promise<EmbeddingResult[]> {
    const url = `${aiConfig.llm.geminiBaseUrl}/${this.modelPath}:batchEmbedContents?key=${aiConfig.llm.geminiApiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: this.modelPath,
          content: { parts: [{ text }] },
          outputDimensionality: this.dimensions,
        })),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`Gemini batch embeddings failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const json = (await res.json()) as { embeddings?: { values?: number[] }[] };
    return (json.embeddings ?? []).map((e) => ({
      vector: e.values ?? [],
      dimensions: this.dimensions,
      provider: this.name,
      model: this.model,
    }));
  }
}
