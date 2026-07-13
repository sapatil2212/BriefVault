import "server-only";
import { prisma } from "@/lib/prisma";
import { aiConfig } from "@/lib/ai/config";

/** Bump when any prompt changes so logs and cache invalidation can track it. */
export const PROMPT_VERSION = "v1";

/**
 * Record a single AI generation for observability: provider, model, prompt
 * version, tokens, latency, estimated cost, and confidence. Never throws —
 * logging failures must not break the generation path.
 */
export async function logAiRequest(input: {
  userId: string;
  documentId?: string | null;
  kind: string;
  provider: string;
  model: string;
  tokensUsed?: number | null;
  latencyMs: number;
  confidence?: number | null;
  success?: boolean;
}) {
  const costUsd =
    input.tokensUsed && aiConfig.costPer1kTokens > 0
      ? Number(((input.tokensUsed / 1000) * aiConfig.costPer1kTokens).toFixed(6))
      : null;

  try {
    await prisma.aiRequestLog.create({
      data: {
        userId: input.userId,
        documentId: input.documentId ?? null,
        kind: input.kind,
        provider: input.provider,
        model: input.model,
        promptVersion: PROMPT_VERSION,
        tokensUsed: input.tokensUsed ?? null,
        latencyMs: input.latencyMs,
        costUsd,
        confidence: input.confidence ?? null,
        success: input.success ?? true,
      },
    });
  } catch (err) {
    console.warn("[ai-log] failed to record request:", err);
  }
}
