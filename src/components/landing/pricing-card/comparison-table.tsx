import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLimit, type PublicPlan, type PlanFeatureFlags } from "@/lib/plans/types";

type CellValue = boolean | string;

/** Human-readable storage from megabytes (e.g. 500 → "500 MB", 20480 → "20 GB"). */
function formatStorage(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  }
  return `${mb.toLocaleString("en-IN")} MB`;
}

interface Row {
  feature: string;
  values: CellValue[];
}

/**
 * Build the comparison rows straight from each plan's real `limits` and
 * `featureFlags`, so the table always matches what the plans actually offer
 * (and the pricing cards above) — no separate hardcoded dataset to drift.
 */
function buildRows(plans: PublicPlan[]): Row[] {
  const flag = (key: keyof PlanFeatureFlags): Row["values"] =>
    plans.map((p) => Boolean(p.featureFlags?.[key]));

  return [
    { feature: "Documents / month", values: plans.map((p) => formatLimit(p.limits.documentsPerMonth)) },
    { feature: "Pages per document", values: plans.map((p) => formatLimit(p.limits.pagesPerDocument)) },
    { feature: "AI questions", values: plans.map((p) => formatLimit(p.limits.aiQuestions)) },
    { feature: "Storage", values: plans.map((p) => formatStorage(p.limits.storageMb)) },
    { feature: "Users", values: plans.map((p) => formatLimit(p.limits.users)) },
    { feature: "Executive summary", values: flag("executiveSummary") },
    { feature: "Quick summary", values: flag("quickSummary") },
    { feature: "Key highlights", values: flag("keyHighlights") },
    { feature: "Important dates", values: flag("importantDates") },
    { feature: "Timeline", values: flag("timeline") },
    { feature: "Case facts", values: flag("caseFacts") },
    { feature: "Arguments", values: flag("arguments") },
    { feature: "Final decision", values: flag("finalDecision") },
    { feature: "Risk analysis", values: flag("riskAnalysis") },
    { feature: "Compliance reports", values: flag("compliance") },
    { feature: "Multi-language", values: flag("multiLanguage") },
    { feature: "Document comparison", values: flag("comparison") },
    { feature: "AI knowledge base", values: flag("knowledgeBase") },
    { feature: "Team collaboration", values: flag("teamCollaboration") },
    { feature: "API access", values: flag("apiAccess") },
    { feature: "Audit logs", values: flag("auditLogs") },
    { feature: "Smart tags", values: flag("smartTags") },
  ];
}

function Cell({ value }: { value: CellValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-5 w-5 text-success" />
    ) : (
      <Minus className="mx-auto h-5 w-5 text-muted-foreground/40" />
    );
  }
  return <span className="text-sm font-medium text-foreground">{value}</span>;
}

export function ComparisonTable({ plans }: { plans: PublicPlan[] }) {
  if (!plans.length) return null;
  const rows = buildRows(plans);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border shadow-soft">
      <table className="w-full min-w-[640px] border-collapse text-center">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="p-5 text-left text-sm font-semibold text-foreground">
              Compare plans
            </th>
            {plans.map((plan) => (
              <th
                key={plan.key}
                className={cn(
                  "p-5 text-sm font-semibold text-foreground",
                  plan.isPopular && "bg-primary/5 text-primary"
                )}
              >
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.feature}
              className={cn("border-b border-border", i % 2 === 1 && "bg-muted/30")}
            >
              <td className="p-4 text-left text-sm text-foreground">{row.feature}</td>
              {row.values.map((value, j) => (
                <td key={plans[j].key} className={cn("p-4", plans[j].isPopular && "bg-primary/5")}>
                  <Cell value={value} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
