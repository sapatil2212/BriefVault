import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/motion";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border pt-32 pb-16 sm:pt-40 sm:pb-20">
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-50" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      <Container className="relative">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <Badge variant="default" className="uppercase tracking-wide">
            {eyebrow}
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            {title}
          </h1>
          <p className="text-balance text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
          {children && <div className="mt-2">{children}</div>}
        </Reveal>
      </Container>
    </section>
  );
}
