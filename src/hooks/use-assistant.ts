"use client";

import * as React from "react";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface StreamEvent {
  type: "delta" | "done";
  text?: string;
  provider?: string;
  model?: string;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Client state + transport for the floating AI assistant. Keeps the running
 * conversation in local state and streams the assistant reply from
 * `/api/ai/assistant/stream` (newline-delimited JSON), appending `delta` text
 * to the in-progress message so the UI types out live. Supports aborting an
 * in-flight response and clearing the thread.
 */
export function useAssistant() {
  const [messages, setMessages] = React.useState<AssistantMessage[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const clear = React.useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
  }, [stop]);

  const send = React.useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isStreaming) return;

      setError(null);
      const userMsg: AssistantMessage = { id: uid(), role: "user", content: text };
      const assistantId = uid();

      // Snapshot history (including the new user turn) for the request body.
      // Drop any empty-content turns (e.g. an aborted/streaming bubble) so the
      // server-side validation (content.min(1)) never rejects the request.
      const history = [...messages, userMsg]
        .map((m) => ({ role: m.role, content: m.content.trim() }))
        .filter((m) => m.content.length > 0);

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ai/assistant/stream", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.message ?? "The assistant is unavailable right now.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Read the NDJSON stream, appending each delta to the assistant message.
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            let evt: StreamEvent;
            try {
              evt = JSON.parse(trimmed) as StreamEvent;
            } catch {
              continue;
            }
            if (evt.type === "delta" && evt.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + evt.text } : m
                )
              );
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User stopped the stream — keep whatever was generated.
        } else {
          const msg = err instanceof Error ? err.message : "Something went wrong.";
          setError(msg);
          // Drop the empty assistant bubble if nothing streamed in.
          setMessages((prev) =>
            prev.filter((m) => !(m.id === assistantId && m.content === ""))
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming]
  );

  return { messages, isStreaming, error, send, stop, clear };
}
