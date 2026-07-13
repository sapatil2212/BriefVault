import { Clock } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { StaggerGroup, Reveal } from "@/components/shared/motion";
import { problems } from "@/data/content";

export function Problem() {
  return (
    <Section id="problem" muted>
      <Container>
        <SectionHeader
          eyebrow="The Problem"
          title="Legal work is drowning in documents."
          description="Professionals spend hours reading lengthy legal documents when they should be advising clients and making decisions."
        />
        <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <Reveal
              key={problem.title}
              className="rounded-lg border border-border bg-card p-6 shadow-soft"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Clock className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {problem.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {problem.description}
              </p>
            </Reveal>
          ))}
        </StaggerGroup>
      </Container>
    </Section>
  );
}
