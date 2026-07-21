import "server-only";
import { aiConfig } from "@/lib/ai/config";
import type { ChatMessage } from "@/lib/ai/types";
import type { LlmCompletion, LlmCompletionOptions, LlmProvider } from "./types";

/**
 * Anthropic Claude provider over the REST Messages API (`/v1/messages`), using
 * the global `fetch` — no SDK dependency. Anthropic separates the system prompt
 * from the message list, so we hoist any `system` messages into the top-level
 * `system` field.
 */
export class AnthropicLlmProvider implements LlmProvider {
  readonly name = "anthropic";
  readonly model = aiConfig.llm.model;

  isReady(): boolean {
    return Boolean(aiConfig.llm.anthropicApiKey);
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": aiConfig.llm.anthropicApiKey ?? "",
      "anthropic-version": aiConfig.llm.anthropicVersion,
    };
  }

  /** Split system messages from the conversational turns Anthropic expects. */
  private split(messages: ChatMessage[]) {
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const turns = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    return { system, turns };
  }

  async complete(
    messages: ChatMessage[],
    options: LlmCompletionOptions = {}
  ): Promise<LlmCompletion> {
    if (!this.isReady()) {
      throw new Error("Anthropic provider is not configured (missing ANTHROPIC_API_KEY).");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);
    options.signal?.addEventListener("abort", () => controller.abort(), { once: true });

    try {
      const { system, turns } = this.split(messages);
      // Anthropic requires max_tokens; JSON tasks get a firm instruction.
      const sys = options.json
        ? `${system}\n\nRespond with a single valid JSON object and nothing else.`
        : system;

      const res = await fetch(`${aiConfig.llm.anthropicBaseUrl}/messages`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          model: options.model ?? this.model,
          max_tokens: options.maxTokens ?? 2048,
          temperature: options.temperature ?? 0.2,
          ...(sys ? { system: sys } : {}),
          messages: turns,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => res.statusText);
        throw new Error(`Anthropic request failed (${res.status}): ${detail.slice(0, 300)}`);
      }

      const json = (await res.json()) as {
        content?: { type: string; text?: string }[];
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      const text =
        json.content
          ?.filter((b) => b.type === "text")
          .map((b) => b.text ?? "")
          .join("")
          .trim() ?? "";

      const tokensUsed =
        (json.usage?.input_tokens ?? 0) + (json.usage?.output_tokens ?? 0) || undefined;

      return { text, tokensUsed, model: options.model ?? this.model, provider: this.name };
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Stream text deltas from the Messages API SSE stream. */
  async *streamComplete(
    messages: ChatMessage[],
    options: LlmCompletionOptions = {}
  ): AsyncIterable<string> {
    if (!this.isReady()) {
      throw new Error("Anthropic provider is not configured (missing ANTHROPIC_API_KEY).");
    }

    const { system, turns } = this.split(messages);
    const res = await fetch(`${aiConfig.llm.anthropicBaseUrl}/messages`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: options.model ?? this.model,
        max_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.2,
        ...(system ? { system } : {}),
        messages: turns,
        stream: true,
      }),
      signal: options.signal,
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`Anthropic stream failed (${res.status}): ${detail.slice(0, 300)}`);
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
        try {
          const json = JSON.parse(payload) as {
            type?: string;
            delta?: { type?: string; text?: string };
          };
          if (json.type === "content_block_delta" && json.delta?.text) {
            yield json.delta.text;
          }
        } catch {
          // Ignore keep-alive / partial frames.
        }
      }
    }
  }
}
