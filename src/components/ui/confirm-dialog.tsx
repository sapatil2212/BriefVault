"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2, Info, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmTone = "danger" | "warning" | "default";

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  icon?: LucideIcon;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

/**
 * Promise-based confirmation. Call `const confirm = useConfirm()` then
 * `if (await confirm({ title, description })) { ...destructive action... }`.
 * Throws if used outside <ConfirmProvider>.
 */
export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a <ConfirmProvider>.");
  return ctx;
}

const toneStyles: Record<
  ConfirmTone,
  { icon: LucideIcon; iconWrap: string; confirmBtn: string }
> = {
  danger: {
    icon: Trash2,
    iconWrap: "bg-red-500/10 text-red-600 dark:text-red-400",
    confirmBtn: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/40",
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    confirmBtn: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500/40",
  },
  default: {
    icon: Info,
    iconWrap: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    confirmBtn:
      "bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-500/40",
  },
};

interface InternalState extends ConfirmOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

/**
 * Provides an app-wide animated confirmation dialog. Mount once high in the
 * tree; every descendant can trigger it via {@link useConfirm}.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<InternalState>({ open: false, title: "" });
  const [pending, setPending] = React.useState(false);

  const confirm = React.useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending(false);
      setState({ ...options, open: true, resolve });
    });
  }, []);

  const settle = React.useCallback(
    (value: boolean) => {
      state.resolve?.(value);
      setState((s) => ({ ...s, open: false, resolve: undefined }));
    },
    [state]
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        state={state}
        pending={pending}
        onCancel={() => settle(false)}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({
  state,
  pending,
  onCancel,
  onConfirm,
}: {
  state: InternalState;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = React.useRef<HTMLButtonElement>(null);

  // Focus the confirm button and wire Esc/Enter while open.
  React.useEffect(() => {
    if (!state.open) return;
    const t = requestAnimationFrame(() => confirmRef.current?.focus());
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [state.open, onCancel, onConfirm]);

  const tone = toneStyles[state.tone ?? "default"];
  const Icon = state.icon ?? tone.icon;

  return (
    <AnimatePresence>
      {state.open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={state.description ? "confirm-desc" : undefined}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", duration: 0.32, bounce: 0.24 }}
          >
            <div className="flex gap-4 p-5">
              <motion.span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  tone.iconWrap
                )}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: "spring", bounce: 0.5 }}
              >
                <Icon className="h-5 w-5" />
              </motion.span>

              <div className="min-w-0 flex-1">
                <h2 id="confirm-title" className="text-[15px] font-semibold text-foreground">
                  {state.title}
                </h2>
                {state.description && (
                  <p id="confirm-desc" className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {state.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-border bg-muted/40 px-5 py-3.5">
              <button
                onClick={onCancel}
                disabled={pending}
                className="rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
              >
                {state.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmRef}
                onClick={onConfirm}
                disabled={pending}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white outline-none transition focus-visible:ring-2 disabled:opacity-60",
                  tone.confirmBtn
                )}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {state.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
