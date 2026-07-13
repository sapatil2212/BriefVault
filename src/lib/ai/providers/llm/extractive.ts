import type { ChatMessage } from "@/lib/ai/types";
import type { LlmCompletion, LlmCompletionOptions, LlmProvider } from "./types";

/**
 * Split text into sentences using punctuation boundaries, keeping legal
 * abbreviations reasonably intact. Deliberately simple and dependency-free.
 */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "her",
  "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "man",
  "new", "now", "old", "see", "two", "way", "who", "boy", "did", "its", "let",
  "put", "say", "she", "too", "use", "that", "this", "with", "from", "have",
  "were", "they", "their", "which", "shall", "such", "been", "into", "upon",
  "said", "would", "there", "these", "than", "then", "them", "also", "may",
]);

/**
 * Frequency-based extractive summarizer. Ranks sentences by the summed
 * frequency of their non-stopword terms, returns the top `maxSentences` in
 * original reading order. Serves as the zero-dependency, offline fallback when
 * no LLM is configured — deterministic and never hallucinates.
 */
export function extractiveSummarize(text: string, maxSentences = 5): string {
  const sentences = splitSentences(text);
  if (sentences.length <= maxSentences) return sentences.join(" ");

  const freq = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
    if (STOP_WORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  const scored = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? [];
    const score = words.reduce((sum, w) => sum + (freq.get(w) ?? 0), 0);
    // Normalize by length to avoid over-favoring very long sentences.
    return { index, sentence, score: score / Math.sqrt(words.length || 1) };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);

  return top.join(" ");
}

/**
 * Offline LLM provider. Produces a deterministic extractive digest of the last
 * user message. Modules that need structured JSON should detect this provider
 * (name === "extractive") and use their own deterministic builders instead.
 */
export class ExtractiveLlmProvider implements LlmProvider {
  readonly name = "extractive";
  readonly model = "extractive-v1";

  isReady(): boolean {
    return true;
  }

  async complete(
    messages: ChatMessage[],
    options: LlmCompletionOptions = {}
  ): Promise<LlmCompletion> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const source = lastUser?.content ?? "";
    const text = extractiveSummarize(source, options.maxTokens ? 8 : 5);
    return {
      text,
      model: this.model,
      provider: this.name,
    };
  }
}
