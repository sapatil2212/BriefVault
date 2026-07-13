"use client";

import * as React from "react";
import {
  X,
  ArrowUp,
  Square,
  Trash2,
  Bot,
  Loader2,
  Minus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssistant } from "@/hooks/use-assistant";

const SUGGESTIONS = [
  "Summarize the key points of a contract",
  "Explain the difference between a writ and an appeal",
  "How do I upload and analyze a document?",
  "Draft a short client update email",
];

/**
 * Floating AI assistant — a ChatGPT/Claude-style copilot pinned to the bottom
 * right of every dashboard page. Streams responses live from
 * `/api/ai/assistant/stream`. Mounted once in the dashboard shell.
 */
export function AssistantWidget() {
  const [open, setOpen] = React.useState(false);
  const { messages, isStreaming, error, send, stop, clear } = useAssistant();
  const [input, setInput] = React.useState("");

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // ── Dragging logic ────────────────────────────────────────────────────────
  const [fabPos, setFabPos] = React.useState({ x: 0, y: 0 });
  const [isDraggingFab, setIsDraggingFab] = React.useState(false);
  const fabDragStart = React.useRef({ x: 0, y: 0 });
  const fabInitialPos = React.useRef({ x: 0, y: 0 });
  const hasDraggedFab = React.useRef(false);

  const [panelPos, setPanelPos] = React.useState({ x: 0, y: 0 });
  const [isDraggingPanel, setIsDraggingPanel] = React.useState(false);
  const panelDragStart = React.useRef({ x: 0, y: 0 });
  const panelInitialPos = React.useRef({ x: 0, y: 0 });

  const onFabMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDraggingFab(true);
    fabDragStart.current = { x: e.clientX, y: e.clientY };
    fabInitialPos.current = { ...fabPos };
    e.preventDefault();
  };

  const onFabTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDraggingFab(true);
    fabDragStart.current = { x: touch.clientX, y: touch.clientY };
    fabInitialPos.current = { ...fabPos };
  };

  const onPanelMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDraggingPanel(true);
    panelDragStart.current = { x: e.clientX, y: e.clientY };
    panelInitialPos.current = { ...panelPos };
    e.preventDefault();
  };

  const onPanelTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const touch = e.touches[0];
    setIsDraggingPanel(true);
    panelDragStart.current = { x: touch.clientX, y: touch.clientY };
    panelInitialPos.current = { ...panelPos };
  };

  React.useEffect(() => {
    if (!isDraggingFab) return;
    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - fabDragStart.current.x;
      const dy = e.clientY - fabDragStart.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDraggedFab.current = true;
      }
      setFabPos({
        x: fabInitialPos.current.x + dx,
        y: fabInitialPos.current.y + dy,
      });
    };
    const onMouseUp = () => {
      setIsDraggingFab(false);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDraggingFab]);

  React.useEffect(() => {
    if (!isDraggingFab) return;
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - fabDragStart.current.x;
      const dy = touch.clientY - fabDragStart.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDraggedFab.current = true;
      }
      setFabPos({
        x: fabInitialPos.current.x + dx,
        y: fabInitialPos.current.y + dy,
      });
    };
    const onTouchEnd = () => {
      setIsDraggingFab(false);
    };
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDraggingFab]);

  React.useEffect(() => {
    if (!isDraggingPanel) return;
    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - panelDragStart.current.x;
      const dy = e.clientY - panelDragStart.current.y;
      setPanelPos({
        x: panelInitialPos.current.x + dx,
        y: panelInitialPos.current.y + dy,
      });
    };
    const onMouseUp = () => {
      setIsDraggingPanel(false);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDraggingPanel]);

  React.useEffect(() => {
    if (!isDraggingPanel) return;
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - panelDragStart.current.x;
      const dy = touch.clientY - panelDragStart.current.y;
      setPanelPos({
        x: panelInitialPos.current.x + dx,
        y: panelInitialPos.current.y + dy,
      });
    };
    const onTouchEnd = () => {
      setIsDraggingPanel(false);
    };
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDraggingPanel]);

  const onFabClick = () => {
    if (hasDraggedFab.current) {
      hasDraggedFab.current = false;
      return;
    }
    setOpen(true);
  };

  // Keep the conversation pinned to the latest message as it streams.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Auto-grow the input up to a max height.
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const submit = () => {
    if (!input.trim() || isStreaming) return;
    send(input);
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <>
      {/* Launcher FAB — radar rings pulsing outward from a bot core */}
      {!open && (
        <button
          onClick={onFabClick}
          onMouseDown={onFabMouseDown}
          onTouchStart={onFabTouchStart}
          aria-label="Open AI assistant"
          className="group fixed bottom-6 right-6 z-50 flex h-16 w-16 cursor-grab active:cursor-grabbing items-center justify-center focus-visible:outline-none"
          style={{ transform: `translate(${fabPos.x}px, ${fabPos.y}px)` }}
        >
          {/* Expanding sonar rings, staggered */}
          <span className="absolute inset-0 rounded-full border border-primary/40 animate-sonar-ring" style={{ animationDelay: "0s" }} />
          <span className="absolute inset-0 rounded-full border border-primary/40 animate-sonar-ring" style={{ animationDelay: "0.8s" }} />
          <span className="absolute inset-0 rounded-full border border-primary/40 animate-sonar-ring" style={{ animationDelay: "1.6s" }} />
 
          {/* Static outer rings for depth, matching the reference design */}
          <span className="absolute inset-0 rounded-full border border-primary/20 transition-colors group-hover:border-primary/40" />
          <span className="absolute inset-[10%] rounded-full border border-primary/30 transition-colors group-hover:border-primary/50" />
 
          {/* Core */}
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-primary bg-primary text-white shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-110">
            <Bot className="h-5 w-5 animate-bot-float text-white" strokeWidth={2.25} />
          </span>
 
          {/* Online indicator */}
          <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
        </button>
      )}
 
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-5 right-5 z-50 flex h-[min(600px,calc(100vh-2.5rem))] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-200 animate-in fade-in slide-in-from-bottom-4"
          style={{ transform: `translate(${panelPos.x}px, ${panelPos.y}px)` }}
        >
          {/* Header */}
          <div
            onMouseDown={onPanelMouseDown}
            onTouchStart={onPanelTouchStart}
            className="flex cursor-move select-none items-center justify-between border-b border-primary/20 bg-primary px-4 py-3 text-white"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <Bot className="h-4 w-4 text-white" strokeWidth={2.25} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">BriefVault Assistant</div>
                <div className="flex items-center gap-1 text-[11px] text-white/80">
                  <span className={cn("h-1.5 w-1.5 rounded-full", isStreaming ? "bg-amber-400" : "bg-emerald-400")} />
                  {isStreaming ? "Thinking…" : "Online"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clear}
                  aria-label="Clear conversation"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Minimize assistant"
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <span className="absolute inset-0 rounded-full border border-primary/30 animate-sonar-ring" />
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-primary bg-background">
                    <Bot className="h-5 w-5 animate-bot-float text-foreground" strokeWidth={2.25} />
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">How can I help?</h3>
                <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
                  Ask about legal concepts, drafting, or how to use BriefVault.
                </p>
                <div className="mt-4 grid w-full gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/60"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" && (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground"
                    )}
                  >
                    {m.content ||
                      (isStreaming && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                        </span>
                      ))}
                  </div>
                </div>
              ))
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border bg-card px-3 py-3">
            <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-1.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Message BriefVault Assistant…"
                className="max-h-[140px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {isStreaming ? (
                <button
                  onClick={stop}
                  aria-label="Stop generating"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground transition-colors hover:bg-muted/80"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={!input.trim()}
                  aria-label="Send message"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
