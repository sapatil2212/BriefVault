import "server-only";
import { aiConfig } from "@/lib/ai/config";
import type { EmbeddingProvider } from "./types";
import { LocalEmbeddingProvider } from "./local";
import { OpenAiEmbeddingProvider } from "./openai";
import { GeminiEmbeddingProvider } from "./gemini";

export type { EmbeddingProvider, EmbeddingResult } from "./types";

let cached: EmbeddingProvider | null = null;

/**
 * Resolve the active embedding provider. Falls back to the deterministic local
 * provider when the configured one is unavailable (missing credentials).
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  if (cached) return cached;

  switch (aiConfig.embeddings.provider) {
    case "openai": {
      const openai = new OpenAiEmbeddingProvider();
      cached = openai.isReady() ? openai : new LocalEmbeddingProvider();
      break;
    }
    case "gemini": {
      const gemini = new GeminiEmbeddingProvider();
      cached = gemini.isReady() ? gemini : new LocalEmbeddingProvider();
      break;
    }
    case "local":
    default:
      cached = new LocalEmbeddingProvider();
  }

  return cached;
}

export function resetEmbeddingProvider(): void {
  cached = null;
}
