"use client";

import CountUp from "react-countup";
import { Container } from "@/components/shared/container";
import { StaggerGroup, Reveal } from "@/components/shared/motion";
import { stats } from "@/data/content";

export function Stats() {
  return (
    <section className="border-y border-border bg-secondary py-16 text-secondary-foreground">
      <Container>
        <StaggerGroup className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <Reveal key={stat.label} className="text-center">
              <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                {stat.prefix}
                <CountUp
                  end={stat.value}
                  duration={2.2}
                  decimals={stat.value % 1 !== 0 ? 1 : 0}
                  enableScrollSpy
                  scrollSpyOnce
                />
                {stat.suffix}
              </p>
              <p className="mt-2 text-sm text-secondary-foreground/70">
                {stat.label}
              </p>
            </Reveal>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
