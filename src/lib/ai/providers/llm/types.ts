import type { ChatMessage } from "@/lib/ai/types";

/**
 * Provider-agnostic LLM contract. Implementations (OpenAI, Claude, Gemini,
 * Azure, local) must not leak provider-specific shapes beyond this interface.
 */
export interface LlmCompletionOptions {
  /** Deterministic output for extraction-style tasks. */
  temperature?: number;
  maxTokens?: number;
  /** Request a JSON object response when the provider supports it. */
  json?: boolean;
  signal?: AbortSignal;
}

export interface LlmCompletion {
  text: string;
  tokensUsed?: number;
  model: string;
  provider: string;
}

export interface LlmProvider {
  readonly name: string;
  readonly model: string;
  /** Returns false when credentials/config are missing. */
  isReady(): boolean;
  complete(
    messages: ChatMessage[],
    options?: LlmCompletionOptions
  ): Promise<LlmCompletion>;
  /**
   * Stream a completion as text deltas. Optional — callers should feature-check
   * and fall back to `complete` (or a deterministic path) when absent.
   */
  streamComplete?(
    messages: ChatMessage[],
    options?: LlmCompletionOptions
  ): AsyncIterable<string>;
}
