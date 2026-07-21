"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroDashboard } from "@/components/landing/hero/hero-dashboard";
import { FeatureMarquee } from "@/components/landing/hero/feature-marquee";

const easing = [0.22, 1, 0.36, 1] as const;

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easing, delay: i * 0.08 },
  }),
};

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-10 sm:pt-32 sm:pb-14">
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="max-w-xl">
            <motion.div custom={0} variants={item} initial="hidden" animate="visible">
              <Badge variant="default" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI Legal Intelligence Platform
              </Badge>
            </motion.div>

            <motion.h1
              custom={1}
              variants={item}
              initial="hidden"
              animate="visible"
              className="mt-6 text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
            >
              Software that summarizes documents{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                efficiently and saves time.
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={item}
              initial="hidden"
              animate="visible"
              className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground"
            >
              Instantly digest contracts, judgments, compliance reports, and complex documents.
              Extract key takeaways, risk highlights, deadlines, and citation-backed insights with AI.
            </motion.p>

            <motion.div
              custom={3}
              variants={item}
              initial="hidden"
              animate="visible"
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Button size="lg" asChild>
                <Link href="/contact">
                  Book a Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>


          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative lg:pl-6"
          >
            <HeroDashboard />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-20 sm:mt-28"
        >
          <FeatureMarquee />
        </motion.div>
      </Container>
    </section>
  );
}
