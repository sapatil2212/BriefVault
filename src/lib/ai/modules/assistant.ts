import "server-only";
import { FallbackLlmProvider, realLlmTiers } from "@/lib/ai/providers/llm";
import { logAiRequest } from "@/lib/ai/logging";
import type { ChatMessage } from "@/lib/ai/types";

/** Events streamed to the assistant widget (newline-delimited JSON). */
export type AssistantStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; provider: string; model: string };

/**
 * System persona for the floating assistant. BriefVault is a legal-intelligence
 * workspace, so the assistant is framed as a helpful legal-tech copilot while
 * staying general enough to answer product and workflow questions. It is
 * explicitly instructed not to fabricate case law or citations.
 */
const SYSTEM_PROMPT = `You are BriefVault Assistant, an AI copilot embedded in a legal document intelligence platform.

Your role:
- Help users understand legal concepts, summarize ideas, draft and refine text, and navigate the BriefVault product (uploading documents, generating summaries, extracting insights, research).
- Be concise, clear, and professional. Use short paragraphs and bullet points when helpful.
- Format responses in Markdown.

Important rules:
- Do NOT invent case citations, statutes, or quotes. If you are unsure or lack a source, say so plainly.
- You do not have access to the user's uploaded documents in this chat. If a question is about a specific uploaded document, tell the user to open that document and use the "Ask AI" feature there.
- Never provide definitive legal advice; remind users to verify with a qualified professional for consequential decisions.`;

const MAX_HISTORY = 20;

function buildMessages(history: { role: "user" | "assistant"; content: string }[]): ChatMessage[] {
  const trimmed = history.slice(-MAX_HISTORY);
  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...trimmed.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
  ];
}

/**
 * Stream a conversational answer as text deltas. Uses the shared tiered chain
 * (primary → OpenRouter #1 → OpenRouter #2) so a rate-limited or exhausted
 * provider transparently fails over to the next. Deliberately excludes the
 * extractive fallback — that suits document summarization, not open chat — so
 * if every real model is unavailable we surface a clear, friendly message.
 */
export async function* assistantChatStream(
  history: { role: "user" | "assistant"; content: string }[],
  userId: string
): AsyncIterable<AssistantStreamEvent> {
  const messages = buildMessages(history);
  const options = { temperature: 0.4, maxTokens: 1024 };
  const startedAt = Date.now();

  const tiers = realLlmTiers();
  if (tiers.length === 0) {
    yield {
      type: "delta",
      text: "⚠️ No AI provider is configured. Please add a Gemini or OpenRouter API key.",
    };
    yield { type: "done", provider: "none", model: "none" };
    return;
  }

  const chain = new FallbackLlmProvider(tiers);

  try {
    let emitted = false;
    for await (const delta of chain.streamComplete(messages, options)) {
      if (delta) {
        emitted = true;
        yield { type: "delta", text: delta };
      }
    }
    yield { type: "done", provider: chain.name, model: chain.model };
    await logAiRequest({
      userId,
      kind: "ASSISTANT",
      provider: chain.name,
      model: chain.model,
      latencyMs: Date.now() - startedAt,
      success: emitted,
    });
    if (!emitted) {
      yield { type: "delta", text: "⚠️ The assistant returned no response. Please try again." };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const friendly = /429|quota|rate.?limit|exceeded/i.test(msg)
      ? "The AI service is currently rate-limited across all providers. Please try again in a moment."
      : "The assistant is temporarily unavailable. Please try again.";
    yield { type: "delta", text: `⚠️ ${friendly}` };
    yield { type: "done", provider: "none", model: "none" };
    await logAiRequest({
      userId,
      kind: "ASSISTANT",
      provider: chain.name,
      model: chain.model,
      latencyMs: Date.now() - startedAt,
      success: false,
    });
  }
}
