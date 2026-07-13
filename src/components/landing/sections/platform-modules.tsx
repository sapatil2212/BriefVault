import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { StaggerGroup, Reveal } from "@/components/shared/motion";
import { detailedFeatures } from "@/data/features";

const moduleIds = ["ai-summaries", "legal-intelligence", "ask-ai", "risk-analysis"];

export function PlatformModules() {
  const modules = detailedFeatures.filter((f) => moduleIds.includes(f.id));

  return (
    <Section id="modules">
      <Container>
        <SectionHeader
          eyebrow="Platform Modules"
          title="Purpose-built modules for real legal work."
          description="Each module is designed around how legal and compliance professionals actually think and work."
        />
        <StaggerGroup className="mt-14 grid gap-6 lg:grid-cols-2">
          {modules.map((mod) => (
            <Reveal
              key={mod.id}
              className="group flex flex-col rounded-lg border border-border bg-card p-7 shadow-soft transition-all hover:border-primary/30 hover:shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <mod.icon className="h-6 w-6" />
                </span>
                <h3 className="text-xl font-semibold text-foreground">{mod.title}</h3>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                {mod.description}
              </p>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {mod.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href={`/features#${mod.id}`}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5"
              >
                Learn more
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          ))}
        </StaggerGroup>
      </Container>
    </Section>
  );
}
