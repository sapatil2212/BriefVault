/**
 * Shared, framework-agnostic types for the AI engine.
 * Kept free of Prisma/Next imports so provider and processing modules stay
 * independently testable.
 */

/** A citation pointing back to the exact source location in a document. */
export interface Citation {
  chunkId: string;
  page?: number | null;
  paragraph?: number | null;
  heading?: string | null;
  quote: string;
}

/** A retrieved chunk plus its relevance score from a vector search. */
export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  content: string;
  heading?: string | null;
  page?: number | null;
  paragraph?: number | null;
  score: number;
}

/** Normalized result envelope returned by every AI intelligence module. */
export interface ModuleResult<T> {
  /** Structured, module-specific output. */
  payload: T;
  citations: Citation[];
  /** 0–1 confidence. Low confidence should surface "information not found". */
  confidence: number;
  provider: string;
  model: string;
  tokensUsed?: number;
  /** True when the engine could not find grounding evidence in the document. */
  notFound?: boolean;
}

/** Roles for chat/completion messages. */
export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Newline-delimited JSON events emitted by the streaming Ask endpoint. */
export type AskStreamEvent =
  | { type: "sources"; sources: RetrievedChunk[] }
  | { type: "delta"; text: string }
  | {
      type: "done";
      confidence: number;
      provider: string;
      model: string;
      notFound: boolean;
    };
