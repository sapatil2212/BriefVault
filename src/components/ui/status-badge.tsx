import { cn } from "@/lib/utils";

/** Document/job status → badge styling. Reused across tables and detail views. */
export type StatusValue =
  | "READY"
  | "PROCESSING"
  | "UPLOADED"
  | "FAILED"
  | "PENDING"
  | "SUCCEEDED"
  | "RUNNING";

// Tints use color/opacity so they read well on both light and dark surfaces.
const tone: Record<string, string> = {
  READY: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  SUCCEEDED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  PROCESSING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  RUNNING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  UPLOADED: "bg-muted text-muted-foreground ring-border",
  PENDING: "bg-muted text-muted-foreground ring-border",
  FAILED: "bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset",
        tone[status] ?? "bg-muted text-muted-foreground ring-border",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status.toLowerCase()}
    </span>
  );
}
