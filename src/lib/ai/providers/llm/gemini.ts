import "server-only";
import { aiConfig } from "@/lib/ai/config";
import type { ChatMessage } from "@/lib/ai/types";
import type { LlmCompletion, LlmCompletionOptions, LlmProvider } from "./types";

/**
 * Google Gemini provider over the Generative Language REST API using the global
 * `fetch` — no SDK dependency. Gemini uses `contents` with `role: user|model`
 * and a separate `system_instruction`, so we map our ChatMessage roles onto it.
 */
export class GeminiLlmProvider implements LlmProvider {
  readonly name = "gemini";
  readonly model = aiConfig.llm.model;

  isReady(): boolean {
    return Boolean(aiConfig.llm.geminiApiKey);
  }

  /** Map ChatMessages to Gemini `contents` + hoist system instructions. */
  private build(messages: ChatMessage[], json?: boolean) {
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const sys = json
      ? `${system}\n\nRespond with a single valid JSON object and nothing else.`
      : system;
    return {
      contents,
      ...(sys ? { system_instruction: { parts: [{ text: sys }] } } : {}),
    };
  }

  async complete(
    messages: ChatMessage[],
    options: LlmCompletionOptions = {}
  ): Promise<LlmCompletion> {
    if (!this.isReady()) {
      throw new Error("Gemini provider is not configured (missing GEMINI_API_KEY).");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);
    options.signal?.addEventListener("abort", () => controller.abort(), { once: true });

    try {
      const url = `${aiConfig.llm.geminiBaseUrl}/models/${this.model}:generateContent?key=${aiConfig.llm.geminiApiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...this.build(messages, options.json),
          generationConfig: {
            temperature: options.temperature ?? 0.2,
            ...(options.maxTokens ? { maxOutputTokens: options.maxTokens } : {}),
            ...(options.json ? { responseMimeType: "application/json" } : {}),
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => res.statusText);
        throw new Error(`Gemini request failed (${res.status}): ${detail.slice(0, 300)}`);
      }

      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: { totalTokenCount?: number };
      };

      const text =
        json.candidates?.[0]?.content?.parts
          ?.map((p) => p.text ?? "")
          .join("")
          .trim() ?? "";

      return {
        text,
        tokensUsed: json.usageMetadata?.totalTokenCount,
        model: this.model,
        provider: this.name,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Stream text deltas from Gemini's SSE `streamGenerateContent` endpoint. */
  async *streamComplete(
    messages: ChatMessage[],
    options: LlmCompletionOptions = {}
  ): AsyncIterable<string> {
    if (!this.isReady()) {
      throw new Error("Gemini provider is not configured (missing GEMINI_API_KEY).");
    }

    const url = `${aiConfig.llm.geminiBaseUrl}/models/${this.model}:streamGenerateContent?alt=sse&key=${aiConfig.llm.geminiApiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...this.build(messages),
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          ...(options.maxTokens ? { maxOutputTokens: options.maxTokens } : {}),
        },
      }),
      signal: options.signal,
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`Gemini stream failed (${res.status}): ${detail.slice(0, 300)}`);
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
            candidates?: { content?: { parts?: { text?: string }[] } }[];
          };
          const delta = json.candidates?.[0]?.content?.parts
            ?.map((p) => p.text ?? "")
            .join("");
          if (delta) yield delta;
        } catch {
          // Ignore keep-alive / partial frames.
        }
      }
    }
  }
}
