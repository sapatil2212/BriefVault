import Link from "next/link";
import { Upload, Sparkles, Search, FolderPlus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickAction = {
  label: string;
  icon: LucideIcon;
  tone: string;
  href: string;
};

const actions: QuickAction[] = [
  { label: "Upload Document", icon: Upload, tone: "bg-violet-500/10 text-violet-500", href: "/dashboard/upload" },
  { label: "AI Summarize", icon: Sparkles, tone: "bg-emerald-500/10 text-emerald-500", href: "/dashboard/summaries" },
  { label: "Legal Research", icon: Search, tone: "bg-amber-500/10 text-amber-500", href: "/dashboard/research" },
  { label: "Create Folder", icon: FolderPlus, tone: "bg-rose-500/10 text-rose-500", href: "/dashboard/folders" },
];

/** Grid of one-tap shortcuts to common workflows. */
export function QuickActions() {
  return (
    <div className="h-full rounded-xl border border-border bg-card p-4">
      <h2 className="text-[15px] font-semibold text-foreground">Quick Actions</h2>
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-2.5 text-center transition hover:border-violet-500/40 hover:bg-violet-500/5"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  action.tone
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="text-[10px] font-medium leading-tight text-muted-foreground">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
