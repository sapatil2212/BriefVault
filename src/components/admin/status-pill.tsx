import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Semantic status pill for the many enum-ish states across the admin console
 * (document status, queue status, health, user status, roles). Maps a raw
 * value to a tone; unknown values fall back to neutral.
 */
type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "violet";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

const VALUE_TONES: Record<string, Tone> = {
  // document / job
  READY: "success",
  SUCCEEDED: "success",
  OPERATIONAL: "success",
  ACTIVE: "success",
  PROCESSING: "info",
  RUNNING: "info",
  UPLOADED: "neutral",
  PENDING: "warning",
  DEGRADED: "warning",
  TRIAL: "warning",
  INFO_REQUESTED: "warning",
  EXPIRED: "warning",
  APPROVED: "success",
  FAILED: "danger",
  DOWN: "danger",
  SUSPENDED: "danger",
  REJECTED: "danger",
  CANCELLED: "danger",
  UNKNOWN: "neutral",
  // plan keys
  FREE: "neutral",
  STARTER: "info",
  PROFESSIONAL: "violet",
  ENTERPRISE: "success",
  // roles
  SUPER_ADMIN: "violet",
  ADMIN: "info",
  USER: "neutral",
  // demo enquiry triage
  NEW: "warning",
  CONTACTED: "info",
  SCHEDULED: "violet",
  CLOSED: "success",
};

export function StatusPill({ value, className }: { value: string; className?: string }) {
  const tone = VALUE_TONES[value?.toUpperCase()] ?? "neutral";
  const label = value?.replace(/_/g, " ").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        TONE_CLASSES[tone],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", {
        "bg-emerald-500": tone === "success",
        "bg-amber-500": tone === "warning",
        "bg-rose-500": tone === "danger",
        "bg-blue-500": tone === "info",
        "bg-violet-500": tone === "violet",
        "bg-slate-400": tone === "neutral",
      })} />
      {label}
    </span>
  );
}
