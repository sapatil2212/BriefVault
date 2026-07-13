import "server-only";
import { prisma } from "@/lib/prisma";
import { aiConfig } from "@/lib/ai/config";
import type { AiProviderInfo } from "@/types/admin";

/**
 * AI provider inventory for the admin console. Reflects real environment
 * configuration (which keys are present, which provider is active) plus recent
 * live usage/health pulled from `AiRequestLog`. Provider secrets are never
 * returned — only a `configured` boolean.
 *
 * Switching the default provider without a code change is a config concern
 * (env / future settings table); this service exposes the current state so the
 * UI can surface it and flag missing credentials.
 */
export async function getProviders(): Promise<AiProviderInfo[]> {
  const llm = aiConfig.llm;
  const active = llm.provider;

  const base: Omit<AiProviderInfo, "isActive" | "isDefault">[] = [
    { key: "openai", label: "OpenAI", configured: Boolean(llm.openaiApiKey), model: llm.model, baseUrl: llm.openaiBaseUrl },
    { key: "anthropic", label: "Anthropic (Claude)", configured: Boolean(llm.anthropicApiKey), baseUrl: llm.anthropicBaseUrl },
    { key: "gemini", label: "Google Gemini", configured: Boolean(llm.geminiApiKey), baseUrl: llm.geminiBaseUrl },
    { key: "openrouter", label: "OpenRouter", configured: Boolean(llm.openrouterApiKey), baseUrl: llm.openrouterBaseUrl },
    { key: "azure-openai", label: "Azure OpenAI", configured: Boolean(llm.azureApiKey && llm.azureEndpoint), baseUrl: llm.azureEndpoint },
    { key: "local", label: "Local (Ollama / LM Studio)", configured: true, baseUrl: llm.localBaseUrl },
    { key: "extractive", label: "Extractive (offline fallback)", configured: true },
  ];

  return base.map((p) => ({
    ...p,
    isActive: p.key === active,
    isDefault: p.key === active,
  }));
}

/** Per-provider health from the last 24h of real request logs. */
export async function getProviderHealth() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const groups = await prisma.aiRequestLog.groupBy({
    by: ["provider"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    _avg: { latencyMs: true },
  });
  const failed = await prisma.aiRequestLog.groupBy({
    by: ["provider"],
    where: { createdAt: { gte: since }, success: false },
    _count: { _all: true },
  });
  const failedMap = new Map(failed.map((f) => [f.provider, f._count._all]));

  return groups.map((g) => {
    const total = g._count._all;
    const fails = failedMap.get(g.provider) ?? 0;
    return {
      provider: g.provider,
      requests24h: total,
      failed24h: fails,
      successRate: total > 0 ? Number((((total - fails) / total) * 100).toFixed(1)) : 100,
      avgLatencyMs: Math.round(g._avg.latencyMs ?? 0),
    };
  });
}
