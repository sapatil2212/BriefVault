import "server-only";
import { z } from "zod";

/**
 * Central, validated configuration for the AI engine.
 *
 * Every provider (LLM, embeddings, vector store) is selected here via env vars,
 * so swapping OpenAI for Gemini/Claude or Pinecone for Qdrant never touches
 * application code. Missing keys degrade gracefully to offline fallbacks rather
 * than crashing, which keeps local development and CI green without secrets.
 */

const envSchema = z.object({
  // LLM
  AI_LLM_PROVIDER: z
    .enum([
      "openai",
      "anthropic",
      "gemini",
      "azure-openai",
      "openrouter",
      "local",
      "extractive",
    ])
    .default("extractive"),
  AI_LLM_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),

  // Anthropic (Claude) — REST /v1/messages
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().url().default("https://api.anthropic.com/v1"),
  ANTHROPIC_VERSION: z.string().default("2023-06-01"),

  // Google Gemini — generativelanguage REST
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_BASE_URL: z
    .string()
    .url()
    .default("https://generativelanguage.googleapis.com/v1beta"),

  // OpenRouter — OpenAI-compatible aggregator (two keys for redundancy)
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY_V2: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  /** Model used for OpenRouter fallbacks (must be a valid OpenRouter model id). */
  OPENROUTER_MODEL: z.string().default("openai/gpt-oss-120b:free"),

  // Azure OpenAI — deployment-based endpoint
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional(),
  AZURE_OPENAI_API_VERSION: z.string().default("2024-06-01"),

  // Local (Ollama / LM Studio / any OpenAI-compatible server)
  LOCAL_LLM_BASE_URL: z.string().url().default("http://localhost:11434/v1"),
  LOCAL_LLM_API_KEY: z.string().default("local"),

  // Embeddings
  AI_EMBEDDING_PROVIDER: z.enum(["openai", "gemini", "local"]).default("local"),
  AI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  AI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(384),

  // Vector store
  AI_VECTOR_STORE: z.enum(["db", "pinecone", "qdrant", "weaviate"]).default("db"),

  // OCR
  OCR_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  OCR_LANGUAGES: z.string().default("eng"),

  // Behaviour
  AI_MAX_CONTEXT_CHUNKS: z.coerce.number().int().positive().default(8),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  /** Analyses below this confidence are flagged low-confidence in the UI. */
  AI_MIN_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.3),
  /** Blended $/1K tokens used to estimate cost in AI request logs (0 = unknown). */
  AI_COST_PER_1K_TOKENS: z.coerce.number().min(0).default(0),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail loud at boot only for genuinely malformed values; optional keys are fine.
  console.error("[ai/config] Invalid AI environment:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid AI environment configuration. See logs above.");
}

const env = parsed.data;

export const aiConfig = {
  llm: {
    provider: env.AI_LLM_PROVIDER,
    model: env.AI_LLM_MODEL,
    openaiApiKey: env.OPENAI_API_KEY,
    openaiBaseUrl: env.OPENAI_BASE_URL,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    anthropicBaseUrl: env.ANTHROPIC_BASE_URL,
    anthropicVersion: env.ANTHROPIC_VERSION,
    geminiApiKey: env.GEMINI_API_KEY,
    geminiBaseUrl: env.GEMINI_BASE_URL,
    openrouterApiKey: env.OPENROUTER_API_KEY,
    openrouterApiKeyV2: env.OPENROUTER_API_KEY_V2,
    openrouterBaseUrl: env.OPENROUTER_BASE_URL,
    openrouterModel: env.OPENROUTER_MODEL,
    azureApiKey: env.AZURE_OPENAI_API_KEY,
    azureEndpoint: env.AZURE_OPENAI_ENDPOINT,
    azureDeployment: env.AZURE_OPENAI_DEPLOYMENT,
    azureApiVersion: env.AZURE_OPENAI_API_VERSION,
    localBaseUrl: env.LOCAL_LLM_BASE_URL,
    localApiKey: env.LOCAL_LLM_API_KEY,
    /** True when the configured LLM provider has the credentials it needs. */
    get ready(): boolean {
      switch (env.AI_LLM_PROVIDER) {
        case "extractive":
        case "local":
          return true;
        case "openai":
          return Boolean(env.OPENAI_API_KEY);
        case "anthropic":
          return Boolean(env.ANTHROPIC_API_KEY);
        case "gemini":
          return Boolean(env.GEMINI_API_KEY);
        case "openrouter":
          return Boolean(env.OPENROUTER_API_KEY);
        case "azure-openai":
          return Boolean(
            env.AZURE_OPENAI_API_KEY &&
              env.AZURE_OPENAI_ENDPOINT &&
              env.AZURE_OPENAI_DEPLOYMENT
          );
        default:
          return false;
      }
    },
  },
  embeddings: {
    provider: env.AI_EMBEDDING_PROVIDER,
    model: env.AI_EMBEDDING_MODEL,
    dimensions: env.AI_EMBEDDING_DIMENSIONS,
  },
  vector: {
    store: env.AI_VECTOR_STORE,
  },
  ocr: {
    enabled: env.OCR_ENABLED,
    languages: env.OCR_LANGUAGES,
  },
  maxContextChunks: env.AI_MAX_CONTEXT_CHUNKS,
  requestTimeoutMs: env.AI_REQUEST_TIMEOUT_MS,
  minConfidence: env.AI_MIN_CONFIDENCE,
  costPer1kTokens: env.AI_COST_PER_1K_TOKENS,
} as const;

export type AiConfig = typeof aiConfig;
