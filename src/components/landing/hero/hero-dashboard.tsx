"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FileText, CalendarClock, Sparkles } from "lucide-react";
import dashboardImg from "@/assets/dashboard.png";

const easing = [0.22, 1, 0.36, 1] as const;

export function HeroDashboard() {
  return (
    <div className="relative">
      {/* Main dashboard panel */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: easing, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-float"
      >
        {/* Window bar */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
          <span className="h-3 w-3 rounded-full bg-success/60" />
          <div className="ml-3 flex items-center gap-2 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Arbitration_Award_2024.pdf
          </div>
        </div>

        {/* Dashboard image */}
        <Image
          src={dashboardImg}
          alt="BriefVault dashboard showing AI-generated document summary, risk score, and compliance status"
          placeholder="blur"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="h-auto w-full"
        />
      </motion.div>

      {/* Floating upload card */}
      <motion.div
        initial={{ opacity: 0, y: 20, x: -10 }}
        animate={{ opacity: 1, y: [0, -8, 0], x: 0 }}
        transition={{
          opacity: { duration: 0.6, delay: 0.6 },
          x: { duration: 0.6, delay: 0.6 },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 },
        }}
        className="absolute -left-4 -top-8 hidden rounded-xl border border-border bg-card p-3 shadow-float sm:-left-10 sm:block"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Uploading…</p>
            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "10%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating timeline card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 0.8 },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
        }}
        className="absolute -bottom-8 -right-4 hidden rounded-xl border border-border bg-card p-3.5 shadow-float sm:-right-8 sm:block"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <CalendarClock className="h-4 w-4 text-primary" />
          Next Deadline
        </div>
        <p className="mt-1 text-sm font-bold text-foreground">Appeal filing</p>
        <p className="text-xs text-muted-foreground">in 12 days · Mar 30</p>
      </motion.div>

      {/* Floating chat pill */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="absolute -right-2 top-1/3 hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-float md:flex md:items-center md:gap-1.5"
      >
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        Ask AI
      </motion.div>
    </div>
  );
}
