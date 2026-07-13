"use client";

import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPlanPrice } from "@/lib/plans/types";
import type { PublicPlan } from "@/lib/plans/types";

/**
 * Compact, selectable plan cards for the signup wizard. Renders as an
 * accessible radio group so keyboard users can pick a plan. Highlights the
 * "Most Popular" plan and surfaces the top few features per plan.
 */
export function PlanSelect({
  plans,
  value,
  onChange,
}: {
  plans: PublicPlan[];
  value: string | null;
  onChange: (key: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Select a plan" className="space-y-2.5">
      {plans.map((plan) => {
        const selected = value === plan.key;
        return (
          <button
            type="button"
            key={plan.key}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(plan.key)}
            className={cn(
              "relative w-full rounded-xl border p-3.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-ring",
              selected
                ? "border-primary bg-primary/5 shadow-soft"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            {plan.isPopular && (
              <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                <Sparkles className="h-3 w-3" />
                Most Popular
              </span>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                    )}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{plan.tagline}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-bold text-foreground">
                  {formatPlanPrice(plan.priceMonthly, plan.currency)}
                </div>
                {plan.priceMonthly > 0 && (
                  <div className="text-[10px] text-muted-foreground">/ month</div>
                )}
              </div>
            </div>

            <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
              {plan.features.slice(0, 4).map((f) => (
                <li key={f} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Check className="h-3 w-3 text-success" />
                  {f}
                </li>
              ))}
            </ul>

            {plan.requiresApproval ? (
              <p className="mt-2 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                Requires approval after signup
              </p>
            ) : (
              <p className="mt-2 text-[10px] font-medium text-success">
                Activated instantly after email verification
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
