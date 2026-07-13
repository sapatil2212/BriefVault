"use client";

import * as React from "react";
import { Bot, User, Send, Loader2, Copy, Check, Sparkles, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  chunkId: string;
  content: string;
  heading?: string | null;
  page?: number | null;
  paragraph?: number | null;
  score: number;
}

type StreamEvent =
  | { type: "sources"; sources: Source[] }
  | { type: "delta"; text: string }
  | { type: "done"; confidence: number; provider: string; model: string; notFound: boolean };

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  confidence?: number;
  pending?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  "What is this document about?",
  "Summarize the key decision.",
  "What are the important dates?",
  "Which acts and sections are cited?",
];

/** Render answer text: strip inline [#id] markers and format basic markdown. */
function renderAnswer(text: string): React.ReactNode {
  const clean = text.replace(/\[#[a-z0-9]+\]/gi, "").replace(/[ \t]{2,}/g, " ");
  return clean.split(/\n+/).map((line, i) => {
    const bullet = /^\s*[-*•]\s+/.test(line);
    if (bullet) {
      return (
        <li key={i} className="ml-4 list-disc">
          {line.replace(/^\s*[-*•]\s+/, "")}
        </li>
      );
    }
    return (
      <p key={i} className="mb-2 last:mb-0">
        {line}
      </p>
    );
  });
}

/**
 * ChatGPT-style RAG chat. Scoped to a single document when `documentId` is set,
 * otherwise queries across all of the user's documents. Answers are grounded
 * with a citation/source panel.
 */
export function AiChat({
  documentId,
  suggestions = DEFAULT_SUGGESTIONS,
  title = "Ask AI",
}: {
  documentId?: string;
  suggestions?: string[];
  title?: string;
}) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [expandedSources, setExpandedSources] = React.useState<Set<string>>(new Set());
  const endRef = React.useRef<HTMLDivElement>(null);

  const toggleSources = (id: string) =>
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: q };
    const pendingId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: pendingId, role: "assistant", content: "", pending: true },
    ]);
    setInput("");
    setBusy(true);

    const update = (patch: Partial<Message>) =>
      setMessages((m) => m.map((msg) => (msg.id === pendingId ? { ...msg, ...patch } : msg)));

    try {
      const res = await fetch("/api/ai/ask/stream", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, ...(documentId ? { documentId } : {}) }),
      });

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message ?? "Request failed.");
      }

      // Consume the newline-delimited JSON event stream.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";

      // Clear the pending flag on first byte so deltas render live.
      update({ pending: false });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let event: StreamEvent;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }
          if (event.type === "sources") {
            update({ sources: event.sources });
          } else if (event.type === "delta") {
            answer += event.text;
            update({ content: answer });
          } else if (event.type === "done") {
            update({ confidence: event.confidence });
          }
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      update({ content: `⚠️ ${message}`, pending: false });
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
          <p className="text-[11px] text-muted-foreground">
            {documentId ? "Answers grounded in this document" : "Answers across your documents"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <Bot className="h-6 w-6" />
            </span>
            <p className="mt-3 text-[14px] font-semibold text-foreground">
              Ask anything about your documents
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Every answer is grounded and cites its sources.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-500"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  msg.role === "user"
                    ? "bg-muted text-muted-foreground"
                    : "bg-violet-600 text-white"
                )}
              >
                {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </span>

              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                  msg.role === "user"
                    ? "bg-violet-600 text-white"
                    : "bg-muted text-foreground"
                )}
              >
                {msg.pending ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking…
                  </span>
                ) : (
                  <>
                    <div className="prose-sm">{renderAnswer(msg.content)}</div>

                    {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 border-t border-border pt-2">
                        <button
                          type="button"
                          onClick={() => toggleSources(msg.id)}
                          className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground"
                        >
                          <span>Sources ({msg.sources.length})</span>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 transition-transform",
                              expandedSources.has(msg.id) && "rotate-180"
                            )}
                          />
                        </button>
                        {expandedSources.has(msg.id) && (
                          <div className="mt-1.5 space-y-1.5">
                            {msg.sources.slice(0, 4).map((s) => (
                              <div
                                key={s.chunkId}
                                className="flex items-start gap-1.5 rounded-lg bg-card px-2 py-1.5 text-[11px] text-muted-foreground ring-1 ring-border"
                              >
                                <FileText className="mt-0.5 h-3 w-3 shrink-0 text-violet-500" />
                                <span>
                                  <span className="font-medium text-foreground">
                                    {s.page != null ? `Page ${s.page}` : "Source"}
                                    {s.paragraph != null ? `, ¶${s.paragraph}` : ""}
                                  </span>{" "}
                                  — {s.content.slice(0, 120)}…
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {msg.role === "assistant" && (
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          onClick={() => copy(msg.content, msg.id)}
                          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          {copied === msg.id ? (
                            <>
                              <Check className="h-3 w-3" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy
                            </>
                          )}
                        </button>
                        {msg.confidence != null && (
                          <span className="text-[10px] text-muted-foreground">
                            confidence {Math.round(msg.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="h-10 flex-1 rounded-lg border border-border bg-muted px-3 text-[13px] text-foreground outline-none transition focus:border-violet-400 focus:bg-card focus:ring-2 focus:ring-violet-500/20"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
