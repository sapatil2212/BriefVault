import { Section, SectionHeader } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { StaggerGroup, Reveal } from "@/components/shared/motion";
import { benefits } from "@/data/content";

export function Benefits() {
  return (
    <Section id="benefits" muted>
      <Container>
        <SectionHeader
          eyebrow="The Benefits"
          title="Measurable impact from the first document."
          description="Teams using BriefVault reclaim their time, respond faster, and never miss a deadline again."
        />
        <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <Reveal
              key={benefit.title}
              className="rounded-lg border border-border bg-card p-6 text-center shadow-soft"
            >
              <p className="text-4xl font-bold tracking-tight text-primary">
                {benefit.stat}
              </p>
              <h3 className="mt-3 text-base font-semibold text-foreground">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {benefit.description}
              </p>
            </Reveal>
          ))}
        </StaggerGroup>
      </Container>
    </Section>
  );
}
