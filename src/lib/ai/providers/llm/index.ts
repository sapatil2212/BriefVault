import "server-only";
import { aiConfig } from "@/lib/ai/config";
import type { LlmProvider } from "./types";
import { OpenAiLlmProvider } from "./openai";
import { AnthropicLlmProvider } from "./anthropic";
import { GeminiLlmProvider } from "./gemini";
import { ExtractiveLlmProvider } from "./extractive";
import { FallbackLlmProvider, type ChainedProvider } from "./fallback";

export type { LlmProvider, LlmCompletion, LlmCompletionOptions } from "./types";
export { extractiveSummarize, splitSentences } from "./extractive";
export { OpenAiLlmProvider } from "./openai";
export { AnthropicLlmProvider } from "./anthropic";
export { GeminiLlmProvider } from "./gemini";
export { FallbackLlmProvider } from "./fallback";

let cached: LlmProvider | null = null;

/**
 * Construct the configured LLM provider (before readiness fallback). Every
 * provider speaks the same {@link LlmProvider} contract, so swapping is a config
 * change only. OpenRouter / Azure / local reuse the OpenAI-compatible client.
 */
function build(): LlmProvider {
  const llm = aiConfig.llm;
  switch (llm.provider) {
    case "openai":
      return new OpenAiLlmProvider();
    case "anthropic":
      return new AnthropicLlmProvider();
    case "gemini":
      return new GeminiLlmProvider();
    case "openrouter":
      return new OpenAiLlmProvider({
        name: "openrouter",
        apiKey: llm.openrouterApiKey,
        baseUrl: llm.openrouterBaseUrl,
        headers: {
          "HTTP-Referer": "https://briefvault.ai",
          "X-Title": "BriefVault",
        },
      });
    case "azure-openai":
      return new OpenAiLlmProvider({
        name: "azure-openai",
        apiKey: llm.azureApiKey,
        azure: {
          endpoint: llm.azureEndpoint ?? "",
          deployment: llm.azureDeployment ?? "",
          apiVersion: llm.azureApiVersion,
        },
      });
    case "local":
      return new OpenAiLlmProvider({
        name: "local",
        apiKey: llm.localApiKey,
        baseUrl: llm.localBaseUrl,
      });
    case "extractive":
    default:
      return new ExtractiveLlmProvider();
  }
}

/** Build an OpenRouter provider bound to a specific API key + fallback model. */
function openRouter(name: string, apiKey?: string): OpenAiLlmProvider {
  return new OpenAiLlmProvider({
    name,
    apiKey,
    baseUrl: aiConfig.llm.openrouterBaseUrl,
    model: aiConfig.llm.openrouterModel,
    headers: {
      "HTTP-Referer": "https://briefvault.ai",
      "X-Title": "BriefVault",
    },
  });
}

/**
 * The ordered "real LLM" tiers, without the deterministic extractive net:
 *   1) the configured primary provider (e.g. Gemini)
 *   2) OpenRouter with OPENROUTER_API_KEY
 *   3) OpenRouter with OPENROUTER_API_KEY_V2
 * De-duplicates when the configured primary is already OpenRouter. Exposed so
 * conversational features (the assistant) can fail over across real models
 * without falling back to extractive summarization, which suits documents only.
 */
export function realLlmTiers(): ChainedProvider[] {
  const llm = aiConfig.llm;
  const tiers: ChainedProvider[] = [];

  const primary = build();
  if (primary.isReady() && primary.name !== "extractive") {
    tiers.push({ label: `primary:${primary.name}`, provider: primary });
  }

  // OpenRouter redundancy — skip the key that's already the primary.
  const primaryIsOpenRouter = primary.name === "openrouter";
  if (llm.openrouterApiKey && !primaryIsOpenRouter) {
    tiers.push({ label: "openrouter#1", provider: openRouter("openrouter", llm.openrouterApiKey) });
  }
  if (llm.openrouterApiKeyV2) {
    tiers.push({ label: "openrouter#2", provider: openRouter("openrouter-v2", llm.openrouterApiKeyV2) });
  }

  return tiers;
}

/**
 * Resolve the active LLM provider. Returns a tiered failover chain (primary →
 * OpenRouter #1 → OpenRouter #2 → extractive) so rate limits or quota
 * exhaustion on any single tier never leave the engine without a working path.
 */
export function getLlmProvider(): LlmProvider {
  if (cached) return cached;
  const tiers = realLlmTiers();
  // Final safety net: deterministic, always-ready extractive provider.
  tiers.push({ label: "extractive", provider: new ExtractiveLlmProvider() });
  cached = new FallbackLlmProvider(tiers);
  return cached;
}

/** True when a real (non-fallback) LLM is the primary tier. */
export function hasRealLlm(): boolean {
  const llm = aiConfig.llm;
  return llm.ready && llm.provider !== "extractive";
}

/** Testing/hot-reload helper to clear the memoized provider. */
export function resetLlmProvider(): void {
  cached = null;
}
