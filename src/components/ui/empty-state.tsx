import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Consistent empty-state block with icon, copy, and an optional action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center",
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-3 text-[15px] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
