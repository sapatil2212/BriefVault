import "server-only";
import { aiConfig } from "@/lib/ai/config";
import type { EmbeddingProvider, EmbeddingResult } from "./types";

/**
 * OpenAI embeddings via REST (no SDK). Honors AI_EMBEDDING_DIMENSIONS through
 * the `dimensions` request field supported by text-embedding-3-* models.
 */
export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai";
  readonly model = aiConfig.embeddings.model;
  readonly dimensions = aiConfig.embeddings.dimensions;

  isReady(): boolean {
    return Boolean(aiConfig.llm.openaiApiKey);
  }

  private async request(input: string[]): Promise<number[][]> {
    const res = await fetch(`${aiConfig.llm.openaiBaseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.llm.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input,
        dimensions: this.dimensions,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`OpenAI embeddings failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      data?: { embedding: number[] }[];
    };
    return (json.data ?? []).map((d) => d.embedding);
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const [vector] = await this.request([text]);
    return {
      vector: vector ?? [],
      dimensions: this.dimensions,
      provider: this.name,
      model: this.model,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];
    const vectors = await this.request(texts);
    return vectors.map((vector) => ({
      vector,
      dimensions: this.dimensions,
      provider: this.name,
      model: this.model,
    }));
  }
}
