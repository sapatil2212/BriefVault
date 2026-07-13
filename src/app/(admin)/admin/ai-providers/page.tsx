"use client";

import { CheckCircle2, XCircle, Cpu, Star } from "lucide-react";
import { useAdminProviders } from "@/hooks/use-admin";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatusPill } from "@/components/admin/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * AI provider inventory. Reflects live environment configuration (which keys
 * exist, which provider is active) and recent health from real request logs.
 * Secrets are never exposed — only a configured flag. Changing the default
 * provider is a config/env concern surfaced here read-only for now.
 */
export default function AdminAiProvidersPage() {
  const { data, isLoading } = useAdminProviders();
  const health = (data?.health ?? []) as Array<{ provider: string; requests24h: number; successRate: number; avgLatencyMs: number }>;
  const healthMap = new Map(health.map((h) => [h.provider, h]));

  return (
    <>
      <AdminPageHeader
        title="AI Providers"
        description="Configured LLM providers, credential status, and live 24h health. Swap providers via configuration without code changes."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "AI Providers" }]}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        {data?.providers.map((p) => {
          const h = healthMap.get(p.key);
          return (
            <div key={p.key} className={cn("rounded-xl border p-4", p.isActive ? "border-violet-500/40 bg-violet-500/5" : "border-border bg-card")}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", p.configured ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400")}>
                    <Cpu className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.key}</p>
                  </div>
                </div>
                {p.isActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">
                    <Star className="h-3 w-3" /> Active
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm">
                {p.configured ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Credentials present</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted-foreground"><XCircle className="h-4 w-4" /> Not configured</span>
                )}
              </div>

              {p.baseUrl && <p className="mt-2 truncate text-xs text-muted-foreground">{p.baseUrl}</p>}

              {h && (
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                  <div><p className="text-sm font-semibold tabular-nums text-foreground">{h.requests24h}</p><p className="text-[10px] uppercase text-muted-foreground">24h reqs</p></div>
                  <div><p className="text-sm font-semibold tabular-nums text-foreground">{h.successRate}%</p><p className="text-[10px] uppercase text-muted-foreground">success</p></div>
                  <div><p className="text-sm font-semibold tabular-nums text-foreground">{h.avgLatencyMs}ms</p><p className="text-[10px] uppercase text-muted-foreground">latency</p></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Provider priority, failover rules, rate limits, and editable API keys will attach to a dedicated <code>ProviderConfig</code> table. The service layer (<code>lib/admin/providers-service.ts</code>) already isolates this so the UI won&apos;t change when that lands.
      </p>
    </>
  );
}
