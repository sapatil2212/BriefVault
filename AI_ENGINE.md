# BriefVault AI Engine — Phase 1

Modular, provider-agnostic document intelligence pipeline. Phase 1 implements
the first module chain end-to-end: **Document Processing → Metadata Extraction →
Executive Summary**, on top of abstractions that every later module plugs into.

## Design principles

- **Provider-agnostic.** LLM, embeddings, and the vector database are chosen via
  environment variables. Swapping OpenAI → Gemini/Claude, or the DB store →
  Pinecone/Qdrant, changes one implementation file, never business logic.
- **Grounded, never hallucinated.** AI modules only use retrieved chunks, cite
  page/paragraph/chunk sources, carry a confidence score, and return
  `notFound: true` when evidence is missing.
- **Works offline.** With no API keys, a deterministic extractive summarizer and
  a hashing-trick embedding provider keep the whole pipeline functional for
  local dev, CI, and tests.
- **Independently replaceable stages.** Each pipeline stage is tracked in
  `processing_jobs` and can fail/retry in isolation.

## Directory map

```
src/lib/ai/
  config.ts                 # validated env-driven configuration
  types.ts                  # shared types (Citation, RetrievedChunk, ModuleResult)
  providers/
    llm/                    # LlmProvider: openai, anthropic, gemini, openrouter,
                            #   azure-openai, local (all REST, no SDK), extractive
                            #   (offline fallback), and the selecting factory
    embeddings/             # EmbeddingProvider: openai, gemini, local (hashing
                            #   trick offline fallback), and the selecting factory
  vector/                   # VectorStore: db-store (cosine), factory (pinecone/qdrant-ready)
  extraction/               # TextExtractor: txt (+ PDF/DOCX/OCR register here later)
  processing/
    clean.ts                # whitespace/noise normalization, language guess
    metadata.ts             # rule-based legal metadata (court, case no., acts, dates…)
    chunk.ts                # structure-aware chunking (headings/paragraphs)
  prompts/                  # one prompt template per module (never inline in services)
  modules/
    executive-summary.ts    # first AI intelligence module
  pipeline/
    process-document.ts     # stage orchestrator (CLEANING→…→ANALYSIS)
  queue/                    # job queue abstraction (in-process now, BullMQ-ready)
  services/                 # document-service, summary-service (business logic)
src/lib/api/response.ts     # standard { success, message, data, meta } envelope
```

## Pipeline stages

`CLEANING → METADATA → CHUNKING → EMBEDDING → INDEXING → ANALYSIS`

Each stage writes a `ProcessingJob` row (RUNNING → SUCCEEDED/FAILED). The
document moves `UPLOADED → PROCESSING → READY|FAILED`. Re-processing is
idempotent (prior chunks/embeddings are cleared first).

## REST APIs

All routes require an authenticated session cookie and return the standard
response envelope.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/documents/process` | Create a document from text and run/enqueue the pipeline. Body: `{ title, text, mimeType?, fileName?, sync? }` |
| GET | `/api/documents/:id/status` | Processing status + per-stage breakdown |
| GET | `/api/documents/:id/results` | Extracted metadata + structured AI results |
| POST | `/api/ai/summarize` | Return/regenerate the Executive Summary. Body: `{ documentId, force? }` |

### Example

```bash
curl -X POST http://localhost:3000/api/documents/process \
  -H "Content-Type: application/json" \
  --cookie "bv_session=<token>" \
  -d '{ "title": "RTI Act 2005", "text": "<document text>", "sync": true }'
```

## Configuration

See the `AI Engine` block in `.env`. Defaults run offline. Switching the LLM
provider is a configuration change only — application code never changes.

```dotenv
# OpenAI
AI_LLM_PROVIDER="openai"
AI_LLM_MODEL="gpt-4o-mini"
OPENAI_API_KEY="sk-..."
AI_EMBEDDING_PROVIDER="openai"

# Anthropic (Claude)
AI_LLM_PROVIDER="anthropic"
AI_LLM_MODEL="claude-3-5-sonnet-latest"
ANTHROPIC_API_KEY="sk-ant-..."

# Google Gemini
AI_LLM_PROVIDER="gemini"
AI_LLM_MODEL="gemini-1.5-flash"
GEMINI_API_KEY="..."

# OpenRouter (any model it fronts)
AI_LLM_PROVIDER="openrouter"
AI_LLM_MODEL="openai/gpt-4o-mini"
OPENROUTER_API_KEY="sk-or-..."

# Azure OpenAI (deployment name is the model)
AI_LLM_PROVIDER="azure-openai"
AZURE_OPENAI_API_KEY="..."
AZURE_OPENAI_ENDPOINT="https://<resource>.openai.azure.com"
AZURE_OPENAI_DEPLOYMENT="<deployment-name>"

# Local / self-hosted (Ollama, LM Studio, vLLM)
AI_LLM_PROVIDER="local"
AI_LLM_MODEL="llama3.1"
LOCAL_LLM_BASE_URL="http://localhost:11434/v1"
```

Any provider that lacks credentials automatically falls back to the offline
extractive path, so the engine always has a working route.

## Database

New models: `Document`, `DocumentMetadata`, `DocumentChunk`,
`DocumentEmbedding`, `AiResult`, `ProcessingJob`.

Apply the schema (creates new tables only — no changes to existing tables):

```bash
npm run db:push
```

## Extending (later phases)

- **PDF/DOCX/OCR**: implement `TextExtractor` and `registerExtractor(...)`.
- **New AI modules** (highlights, timeline, risk, RAG chat, reports): add a
  prompt template in `prompts/`, a module in `modules/`, an `AiResultKind`, and
  wire it into `pipeline/process-document.ts` or its own endpoint.
- **Real vector DB / BullMQ**: implement `VectorStore` / `JobQueue` and select
  via config — no caller changes.
```
