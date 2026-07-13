import "server-only";
import { aiConfig } from "@/lib/ai/config";
import { getLlmProvider, extractiveSummarize } from "@/lib/ai/providers/llm";
import { getEmbeddingProvider } from "@/lib/ai/providers/embeddings";
import { getVectorStore } from "@/lib/ai/vector";
import { ASK_SYSTEM, buildAskUser } from "@/lib/ai/prompts";
import type {
  AskStreamEvent,
  Citation,
  ModuleResult,
  RetrievedChunk,
} from "@/lib/ai/types";

export interface AskPayload {
  answer: string;
  /** Chunks retrieved as grounding evidence (for the citation panel). */
  sources: RetrievedChunk[];
}

const NOT_FOUND = "Information not found in the provided documents.";

/** Build citations from the chunk IDs referenced in an answer (`[#id]`). */
function citationsFromAnswer(answer: string, chunks: RetrievedChunk[]): Citation[] {
  const byId = new Map(chunks.map((c) => [c.chunkId, c]));
  const referenced = new Set(
    Array.from(answer.matchAll(/\[#([a-z0-9]+)\]/gi)).map((m) => m[1])
  );
  const ids = referenced.size > 0 ? [...referenced] : chunks.slice(0, 3).map((c) => c.chunkId);
  return ids
    .filter((id) => byId.has(id))
    .map((id) => {
      const c = byId.get(id)!;
      return {
        chunkId: id,
        page: c.page,
        paragraph: c.paragraph,
        heading: c.heading,
        quote: c.content.slice(0, 220),
      };
    });
}

/**
 * Answer a natural-language question over the user's documents using RAG.
 *
 * Pipeline: embed query → vector search (scoped to `documentIds`) → build
 * grounded context → LLM answer (or deterministic extractive fallback). Always
 * returns the retrieved sources so the UI can render a citation panel, and
 * yields the "information not found" message when retrieval is empty.
 */
export async function askQuestion(
  question: string,
  documentIds: string[]
): Promise<ModuleResult<AskPayload>> {
  const embedder = getEmbeddingProvider();
  const store = getVectorStore();
  const llm = getLlmProvider();

  const { vector } = await embedder.embed(question);
  const sources = await store.searchSimilar(vector, {
    // Retrieve extra chunks so broad questions ("summarize", "key points",
    // "analyze page N") have enough grounding to synthesize a full answer.
    topK: Math.max(aiConfig.maxContextChunks, 12),
    filter: documentIds.length ? { documentIds } : undefined,
    hybridWeight: 0.3,
    queryText: question,
  });

  if (sources.length === 0) {
    return {
      payload: { answer: NOT_FOUND, sources: [] },
      citations: [],
      confidence: 0,
      provider: llm.name,
      model: llm.model,
      notFound: true,
    };
  }

  // ── Real LLM path ──────────────────────────────────────────────────────────
  if (llm.name !== "extractive" && llm.isReady()) {
    try {
      const completion = await llm.complete(
        [
          { role: "system", content: ASK_SYSTEM },
          { role: "user", content: buildAskUser(question, sources) },
        ],
        { temperature: 0.3 }
      );
      const raw = completion.text.trim();
      const notFound = raw.length === 0 || raw.includes("NO_RELEVANT_CONTEXT");
      const answer = notFound ? NOT_FOUND : raw;
      return {
        payload: { answer, sources },
        citations: notFound ? [] : citationsFromAnswer(answer, sources),
        confidence: notFound ? 0.2 : Math.min(0.95, 0.55 + sources[0].score / 2),
        provider: completion.provider,
        model: completion.model,
        tokensUsed: completion.tokensUsed,
        notFound,
      };
    } catch (err) {
      console.warn("[ask] LLM path failed, using fallback:", err);
    }
  }

  // ── Deterministic extractive fallback ───────────────────────────────────────
  // Summarize the top retrieved chunks; grounded and never fabricated.
  const combined = sources.map((s) => s.content).join("\n\n");
  const answer = extractiveSummarize(combined, 4) || NOT_FOUND;
  return {
    payload: { answer, sources },
    citations: citationsFromAnswer("", sources),
    confidence: 0.4,
    provider: "extractive",
    model: "extractive-v1",
    notFound: answer === NOT_FOUND,
  };
}

/** Split text into small groups of words for smooth pseudo-streaming. */
function* wordChunks(text: string, size = 3): Generator<string> {
  const parts = text.split(/(\s+)/);
  let buf = "";
  let count = 0;
  for (const p of parts) {
    buf += p;
    if (p.trim()) count++;
    if (count >= size) {
      yield buf;
      buf = "";
      count = 0;
    }
  }
  if (buf) yield buf;
}

/**
 * Streaming variant of {@link askQuestion}. Yields a `sources` event first,
 * then answer `delta` events (token stream from the LLM, or word chunks from
 * the deterministic fallback), then a final `done` event with metadata.
 */
export async function* askQuestionStream(
  question: string,
  documentIds: string[]
): AsyncGenerator<AskStreamEvent> {
  const embedder = getEmbeddingProvider();
  const store = getVectorStore();
  const llm = getLlmProvider();

  const { vector } = await embedder.embed(question);
  const sources = await store.searchSimilar(vector, {
    // Retrieve extra chunks so broad questions ("summarize", "key points",
    // "analyze page N") have enough grounding to synthesize a full answer.
    topK: Math.max(aiConfig.maxContextChunks, 12),
    filter: documentIds.length ? { documentIds } : undefined,
    hybridWeight: 0.3,
    queryText: question,
  });

  yield { type: "sources", sources };

  if (sources.length === 0) {
    yield { type: "delta", text: NOT_FOUND };
    yield { type: "done", confidence: 0, provider: llm.name, model: llm.model, notFound: true };
    return;
  }

  // ── Real streaming LLM path ────────────────────────────────────────────────
  if (llm.name !== "extractive" && llm.isReady() && llm.streamComplete) {
    try {
      let full = "";
      let gateOpen = false; // Hold output until we know it isn't the sentinel.
      const flushGate = function* (): Generator<AskStreamEvent> {
        // Called once we're confident the reply is real content.
        if (!gateOpen) {
          gateOpen = true;
          if (full) yield { type: "delta", text: full };
        }
      };

      for await (const delta of llm.streamComplete(
        [
          { role: "system", content: ASK_SYSTEM },
          { role: "user", content: buildAskUser(question, sources) },
        ],
        { temperature: 0.3 }
      )) {
        full += delta;
        if (gateOpen) {
          yield { type: "delta", text: delta };
        } else if (full.length >= 25 && !"NO_RELEVANT_CONTEXT".startsWith(full.trimStart().slice(0, 20))) {
          // Enough text to be sure it's not the sentinel — release buffered text.
          yield* flushGate();
        }
      }

      // If we already streamed real content, never fall into the sentinel path.
      const isSentinel = !gateOpen && (full.includes("NO_RELEVANT_CONTEXT") || full.trim().length === 0);
      if (!isSentinel) {
        // Release any still-buffered content (short answers under the gate size).
        yield* flushGate();
        yield {
          type: "done",
          confidence: Math.min(0.95, 0.55 + sources[0].score / 2),
          provider: llm.name,
          model: llm.model,
          notFound: false,
        };
      } else {
        yield { type: "delta", text: NOT_FOUND };
        yield { type: "done", confidence: 0.2, provider: llm.name, model: llm.model, notFound: true };
      }
      return;
    } catch (err) {
      console.warn("[ask/stream] LLM path failed, using fallback:", err);
    }
  }

  // ── Deterministic extractive fallback (pseudo-streamed) ──────────────────────
  const combined = sources.map((s) => s.content).join("\n\n");
  const answer = extractiveSummarize(combined, 4) || NOT_FOUND;
  for (const chunk of wordChunks(answer)) {
    yield { type: "delta", text: chunk };
  }
  yield {
    type: "done",
    confidence: answer === NOT_FOUND ? 0 : 0.4,
    provider: "extractive",
    model: "extractive-v1",
    notFound: answer === NOT_FOUND,
  };
}
