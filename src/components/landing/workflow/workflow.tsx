"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { workflow } from "@/data/content";

const easing = [0.22, 1, 0.36, 1] as const;

export function Workflow() {
  return (
    <div className="grid gap-4 md:grid-cols-6">
      {workflow.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: easing, delay: index * 0.1 }}
          className="relative"
        >
          <div className="flex h-full flex-col items-center rounded-lg border border-border bg-card p-5 text-center shadow-soft">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <step.icon className="h-6 w-6" />
            </span>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Step {index + 1}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </div>
          {index < workflow.length - 1 && (
            <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-primary">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
