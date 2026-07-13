"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PricingPlan } from "@/types";

const easing = [0.22, 1, 0.36, 1] as const;

export function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easing } },
      }}
      className={cn(
        "relative flex flex-col rounded-2xl border p-8 shadow-soft transition-all",
        plan.highlight
          ? "border-primary bg-card shadow-float lg:-mt-4 lg:mb-4"
          : "border-border bg-card hover:border-primary/30"
      )}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-soft">
          <Sparkles className="h-3.5 w-3.5" />
          Most Popular
        </span>
      )}
      <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
      <p className="mt-2 min-h-[48px] text-sm leading-relaxed text-muted-foreground">
        {plan.tagline}
      </p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight text-foreground">
          {plan.priceLabel ?? "Custom"}
        </span>
        <span className="text-sm text-muted-foreground">
          {plan.priceLabel ? plan.pricePeriod ?? "" : "pricing"}
        </span>
      </div>
      <Button
        className="mt-6"
        variant={plan.highlight ? "default" : "outline"}
        asChild
      >
        <Link href={plan.href ?? "/contact"}>{plan.cta}</Link>
      </Button>
      <ul className="mt-8 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
              <Check className="h-3 w-3" />
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
