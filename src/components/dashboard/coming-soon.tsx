import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

/** Placeholder for modules whose backend/UI ships in a later phase. */
export function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
      <EmptyState
        icon={icon}
        title="Coming soon"
        description="This module is on the roadmap and will connect to the BriefVault engine in an upcoming release."
      />
    </div>
  );
}
