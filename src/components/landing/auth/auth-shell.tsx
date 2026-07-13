"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Logo } from "@/components/shared/logo";

const easing = [0.22, 1, 0.36, 1] as const;

const highlights = [
  "Citation-backed answers, never a hallucination",
  "SOC 2 Type II · enterprise-grade security",
  "Value on day one — no lengthy setup",
];

export function AuthShell({
  children,
  quote,
}: {
  children: ReactNode;
  quote?: { text: string; name: string; role: string };
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easing }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10"
        >
          {children}
        </motion.div>
      </div>

      {/* Brand side */}
      <div className="relative hidden overflow-hidden bg-secondary lg:block">
        <div className="pointer-events-none absolute inset-0 bg-dot opacity-[0.12]" />
        <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Legal Intelligence Platform
          </motion.span>

          <div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: easing }}
              className="text-balance text-3xl font-semibold leading-tight text-white"
            >
              Understand any legal document in minutes, not hours.
            </motion.h2>

            <ul className="mt-8 space-y-3">
              {highlights.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-sm text-white/80"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </motion.li>
              ))}
            </ul>
          </div>

          {quote && (
            <motion.figure
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-white/90">
                “{quote.text}”
              </blockquote>
              <figcaption className="mt-3 text-xs text-white/60">
                {quote.name} · {quote.role}
              </figcaption>
            </motion.figure>
          )}
        </div>
      </div>
    </div>
  );
}
