import { Section, SectionHeader } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/motion";
import { Workflow } from "@/components/landing/workflow/workflow";

export function Solution() {
  return (
    <Section id="solution">
      <Container>
        <SectionHeader
          eyebrow="The Solution"
          title="From lengthy documents to actionable insights."
          description="BriefVault converts judgments, contracts, and circulars into structured intelligence you can act on — in one continuous workflow."
        />
        <Reveal className="mt-14">
          <Workflow />
        </Reveal>
      </Container>
    </Section>
  );
}
