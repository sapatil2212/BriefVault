import { ShieldCheck, Sparkles, Lock, Zap } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { StaggerGroup, Reveal } from "@/components/shared/motion";
import { whyBriefVault } from "@/data/content";

const icons = [Sparkles, Zap, ShieldCheck, Lock];

export function WhyBriefVault() {
  return (
    <Section id="why">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeader
            align="left"
            eyebrow="Why BriefVault"
            title="Legal AI you can actually trust."
            description="Generic AI guesses. BriefVault is engineered for legal work — grounded, secure, and built to earn the trust of the most demanding teams."
            className="lg:sticky lg:top-28"
          />
          <StaggerGroup className="grid gap-5 sm:grid-cols-2">
            {whyBriefVault.map((reason, index) => {
              const Icon = icons[index % icons.length];
              return (
                <Reveal
                  key={reason.title}
                  className="rounded-lg border border-border bg-card p-6 shadow-soft"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {reason.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {reason.description}
                  </p>
                </Reveal>
              );
            })}
          </StaggerGroup>
        </div>
      </Container>
    </Section>
  );
}
