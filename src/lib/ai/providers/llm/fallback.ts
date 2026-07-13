import "server-only";
import type { ChatMessage } from "@/lib/ai/types";
import type { LlmCompletion, LlmCompletionOptions, LlmProvider } from "./types";

/** A provider labelled with a human-friendly tier name for logging. */
export interface ChainedProvider {
  label: string;
  provider: LlmProvider;
}

/** Errors that mean "try the next provider" rather than a hard client error. */
function isRetriable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  // Rate limits, quota, auth, server, and network errors → fail over.
  return /\b(401|403|408|409|425|429|5\d\d)\b|quota|rate.?limit|exceeded|unavailable|timeout|network|fetch failed|ECONNRESET|ENOTFOUND/i.test(
    msg
  );
}

/**
 * Ordered failover across multiple LLM providers. Tries each ready provider in
 * turn; on a retriable failure (rate limit / quota / transient) it moves to the
 * next. This is what powers the tiered chain:
 *   1) Gemini  →  2) OpenRouter (key #1)  →  3) OpenRouter (key #2)
 *
 * The chain speaks the same {@link LlmProvider} contract, so every consumer
 * (assistant, analysis engine, ask/RAG) transparently gains resilience.
 */
export class FallbackLlmProvider implements LlmProvider {
  readonly name: string;
  readonly model: string;
  private readonly tiers: ChainedProvider[];

  constructor(tiers: ChainedProvider[]) {
    this.tiers = tiers.filter((t) => t.provider.isReady());
    const first = this.tiers[0]?.provider;
    this.name = first?.name ?? "none";
    this.model = first?.model ?? "none";
  }

  isReady(): boolean {
    return this.tiers.length > 0;
  }

  async complete(
    messages: ChatMessage[],
    options?: LlmCompletionOptions
  ): Promise<LlmCompletion> {
    let lastError: unknown = null;
    for (const { label, provider } of this.tiers) {
      try {
        const result = await provider.complete(messages, options);
        if (result.text) return result;
        lastError = new Error(`${label} returned an empty response.`);
      } catch (err) {
        lastError = err;
        console.warn(`[llm-chain] ${label} failed, trying next:`, err instanceof Error ? err.message : err);
        if (!isRetriable(err)) throw err;
      }
    }
    throw lastError ?? new Error("No LLM provider is available.");
  }

  async *streamComplete(
    messages: ChatMessage[],
    options?: LlmCompletionOptions
  ): AsyncIterable<string> {
    let lastError: unknown = null;

    for (const { label, provider } of this.tiers) {
      let emitted = false;
      try {
        if (typeof provider.streamComplete === "function") {
          for await (const delta of provider.streamComplete(messages, options)) {
            if (delta) {
              emitted = true;
              yield delta;
            }
          }
          if (emitted) return;
          // No content streamed — treat as a soft failure and try the next tier.
          lastError = new Error(`${label} streamed no content.`);
          continue;
        }

        // Provider has no streaming — use a single completion as one chunk.
        const result = await provider.complete(messages, options);
        if (result.text) {
          yield result.text;
          return;
        }
        lastError = new Error(`${label} returned an empty response.`);
      } catch (err) {
        lastError = err;
        console.warn(`[llm-chain] ${label} stream failed, trying next:`, err instanceof Error ? err.message : err);
        // If tokens already reached the client we can't cleanly switch tiers.
        if (emitted) return;
        if (!isRetriable(err)) throw err;
      }
    }

    throw lastError ?? new Error("No LLM provider is available.");
  }
}
