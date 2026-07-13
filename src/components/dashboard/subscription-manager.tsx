"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowUpRight, ArrowDownRight, Sparkles, CalendarClock, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/admin/status-pill";
import { Button } from "@/components/ui/button";
import { formatPlanPrice, formatLimit, type PublicPlan } from "@/lib/plans/types";
import { formatDate } from "@/lib/format";
import type { SubscriptionOverview } from "@/lib/subscriptions/service";

function formatStorageMb(bytes: number): string {
  if (!bytes || bytes <= 0) return "0";
  const mbVal = bytes / (1024 * 1024);
  if (mbVal < 0.01) return "<0.01";
  if (mbVal < 1) return mbVal.toFixed(2);
  if (mbVal < 10) return mbVal.toFixed(1);
  return Math.round(mbVal).toLocaleString("en-IN");
}

function UsageBar({
  label,
  used,
  limit,
  unit,
  usedDisplay,
}: {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  usedDisplay?: string;
}) {
  const unlimited = limit < 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const displayText = usedDisplay ?? used.toLocaleString("en-IN");

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {displayText}
          {unit ? ` ${unit}` : ""} / {formatLimit(limit, unit)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={pct >= 90 ? "h-full rounded-full bg-rose-500 transition-all duration-300" : "h-full rounded-full bg-primary transition-all duration-300"}
          style={{ width: unlimited ? "8%" : `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SubscriptionManager({
  overview,
  plans,
}: {
  overview: SubscriptionOverview;
  plans: PublicPlan[];
}) {
  const router = useRouter();
  const [updatingKey, setUpdatingKey] = React.useState<string | null>(null);

  const currentKey = overview.plan?.key ?? "FREE";
  const currentPlanObj = plans.find((p) => p.key === currentKey);
  const currentSortOrder = currentPlanObj?.sortOrder ?? 0;

  async function handlePlanChange(targetPlan: PublicPlan) {
    if (targetPlan.key === currentKey) return;
    setUpdatingKey(targetPlan.key);

    const isUpgrade = targetPlan.sortOrder > currentSortOrder;
    const actionName = isUpgrade ? "upgraded" : "downgraded";

    try {
      const res = await fetch("/api/subscription/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey: targetPlan.key }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update subscription plan.");
      }

      if (json.data?.result?.requiresApproval || json.data?.result?.redirectUrl) {
        toast.success(`Requested ${targetPlan.name} plan!`, {
          description: "Your upgrade requires BriefVault team approval. Redirecting to pending page...",
        });
        setTimeout(() => {
          window.location.href = json.data.result.redirectUrl || "/pending";
        }, 800);
        return;
      }

      toast.success(`Plan ${actionName} to ${targetPlan.name}!`, {
        description: `You are now on the ${targetPlan.name} plan.`,
      });

      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Could not change subscription plan.");
    } finally {
      setUpdatingKey(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Subscription & Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription tier, track real-time workspace limits, and upgrade or downgrade anytime.
        </p>
      </div>

      {/* Current plan card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Active Subscription</div>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-2xl font-bold text-foreground">{overview.plan?.name ?? "No Plan"}</span>
              {overview.status && <StatusPill value={overview.status} />}
            </div>
            {overview.plan && (
              <div className="mt-1 text-sm text-muted-foreground">
                {formatPlanPrice(overview.plan.priceMonthly, overview.plan.currency)}
                {overview.plan.priceMonthly > 0 && " / month"}
              </div>
            )}
          </div>

          {overview.currentPeriodEnd && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-violet-500" />
              Renews {formatDate(overview.currentPeriodEnd)}
            </div>
          )}
        </div>

        {overview.plan && overview.plan.features.length > 0 && (
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 border-t border-border pt-4">
            {overview.plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                  <Check className="h-3 w-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Usage card */}
      {overview.limits && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Current Billing Period Usage</h2>
          <div className="mt-5 space-y-5">
            <UsageBar
              label="Documents processed this month"
              used={overview.usage.documentsThisMonth}
              limit={overview.limits.documentsPerMonth}
            />
            <UsageBar
              label="Storage space utilized"
              used={overview.usage.storageBytes / (1024 * 1024)}
              limit={overview.limits.storageMb}
              unit="MB"
              usedDisplay={formatStorageMb(overview.usage.storageBytes)}
            />
          </div>
        </div>
      )}

      {/* All Available Plans Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Available Tier Options</h2>
            <p className="text-sm text-muted-foreground">
              Choose the plan that fits your Legal AI workload needs. Instant tier switching.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.key === currentKey;
            const isUpgrade = plan.sortOrder > currentSortOrder;
            const isLoading = updatingKey === plan.key;

            return (
              <div
                key={plan.key}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                  isCurrent
                    ? "border-violet-500 bg-violet-500/5 shadow-md dark:bg-violet-950/20 ring-1 ring-violet-500/50"
                    : plan.isPopular
                    ? "border-primary/50 bg-card shadow-soft"
                    : "border-border bg-card hover:border-border/80"
                }`}
              >
                {plan.isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-[11px] font-semibold text-white shadow">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-semibold text-white shadow flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Current Plan
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground min-h-[32px]">{plan.tagline}</p>

                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">
                      {formatPlanPrice(plan.priceMonthly, plan.currency)}
                    </span>
                    {plan.priceMonthly > 0 && <span className="ml-1 text-xs text-muted-foreground">/mo</span>}
                  </div>

                  <ul className="mt-5 space-y-2 border-t border-border pt-4 text-xs">
                    {plan.features.slice(0, 7).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-foreground">
                        <Check className="h-3.5 w-3.5 shrink-0 text-violet-500 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full cursor-default border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" disabled>
                      Active Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePlanChange(plan)}
                      disabled={isLoading || Boolean(updatingKey)}
                      variant={isUpgrade ? "default" : "outline"}
                      className={`w-full flex items-center justify-center gap-1.5 ${
                        isUpgrade
                          ? "bg-violet-600 hover:bg-violet-700 text-white"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : isUpgrade ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Upgrade to {plan.name}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Downgrade to {plan.name}
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
