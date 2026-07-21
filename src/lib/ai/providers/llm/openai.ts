import "server-only";
import { aiConfig } from "@/lib/ai/config";
import type { ChatMessage } from "@/lib/ai/types";
import type { LlmCompletion, LlmCompletionOptions, LlmProvider } from "./types";

/**
 * Configuration for an OpenAI-compatible chat endpoint. The same wire contract
 * (`/chat/completions`) is spoken by OpenAI, OpenRouter, Azure OpenAI, and local
 * servers (Ollama, LM Studio, vLLM), so one implementation serves them all.
 */
export interface OpenAiCompatConfig {
  /** Provider label surfaced in results/logs (e.g. "openai", "openrouter"). */
  name?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  /** Extra request headers (e.g. OpenRouter attribution). */
  headers?: Record<string, string>;
  /** Azure uses `api-key` header + deployment URL + `api-version` query. */
  azure?: { endpoint: string; deployment: string; apiVersion: string };
}

/**
 * OpenAI (and OpenAI-compatible) chat provider over the REST API using the
 * global `fetch` — no SDK dependency. Construct with defaults for OpenAI, or
 * pass a config to target OpenRouter / Azure / a local server.
 */
export class OpenAiLlmProvider implements LlmProvider {
  readonly name: string;
  readonly model: string;
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly azure?: OpenAiCompatConfig["azure"];

  constructor(config: OpenAiCompatConfig = {}) {
    this.name = config.name ?? "openai";
    this.apiKey = config.apiKey ?? aiConfig.llm.openaiApiKey;
    this.baseUrl = config.baseUrl ?? aiConfig.llm.openaiBaseUrl;
    this.model = config.model ?? aiConfig.llm.model;
    this.headers = config.headers ?? {};
    this.azure = config.azure;
  }

  isReady(): boolean {
    if (this.azure) {
      return Boolean(this.apiKey && this.azure.endpoint && this.azure.deployment);
    }
    return Boolean(this.apiKey);
  }

  /** Build the chat/completions URL + auth headers for the active target. */
  private endpoint(): { url: string; headers: Record<string, string> } {
    if (this.azure) {
      const base = this.azure.endpoint.replace(/\/$/, "");
      return {
        url: `${base}/openai/deployments/${this.azure.deployment}/chat/completions?api-version=${this.azure.apiVersion}`,
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey ?? "",
          ...this.headers,
        },
      };
    }
    return {
      url: `${this.baseUrl}/chat/completions`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...this.headers,
      },
    };
  }

  async complete(
    messages: ChatMessage[],
    options: LlmCompletionOptions = {}
  ): Promise<LlmCompletion> {
    if (!this.isReady()) {
      throw new Error(`${this.name} provider is not configured (missing API key).`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);
    options.signal?.addEventListener("abort", () => controller.abort(), { once: true });

    try {
      const { url, headers } = this.endpoint();
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: options.model ?? this.model,
          messages,
          temperature: options.temperature ?? 0.2,
          ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
          ...(options.json ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => res.statusText);
        throw new Error(`${this.name} request failed (${res.status}): ${detail.slice(0, 300)}`);
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { total_tokens?: number };
      };

      const text = json.choices?.[0]?.message?.content?.trim() ?? "";
      return {
        text,
        tokensUsed: json.usage?.total_tokens,
        model: options.model ?? this.model,
        provider: this.name,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Stream deltas from the /chat/completions SSE endpoint (stream: true). */
  async *streamComplete(
    messages: ChatMessage[],
    options: LlmCompletionOptions = {}
  ): AsyncIterable<string> {
    if (!this.isReady()) {
      throw new Error(`${this.name} provider is not configured (missing API key).`);
    }

    const { url, headers } = this.endpoint();
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: options.model ?? this.model,
        messages,
        temperature: options.temperature ?? 0.2,
        ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
        stream: true,
      }),
      signal: options.signal,
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`${this.name} stream failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Ignore keep-alive / partial frames.
        }
      }
    }
  }
}
