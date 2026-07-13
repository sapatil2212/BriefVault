import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { StaggerGroup, Reveal } from "@/components/shared/motion";
import { FeatureCard } from "@/components/landing/feature-card/feature-card";
import { Button } from "@/components/ui/button";
import { homeFeatures } from "@/data/features";

export function FeaturesGrid() {
  return (
    <Section id="features" muted>
      <Container>
        <SectionHeader
          eyebrow="Platform Capabilities"
          title="Everything you need to work with legal documents."
          description="One platform that reads, structures, and reasons over your documents — from executive summaries to enterprise security."
        />
        <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {homeFeatures.slice(0, 12).map((feature) => {
            const Icon = feature.icon;
            return (
              <FeatureCard
                key={feature.id}
                icon={<Icon />}
                title={feature.title}
                description={feature.description}
              />
            );
          })}
        </StaggerGroup>
        <Reveal className="mt-12 flex justify-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/features">
              Explore all features
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </Container>
    </Section>
  );
}
