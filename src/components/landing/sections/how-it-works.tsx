import { UploadCloud, Wand2, Rocket } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { StaggerGroup, Reveal } from "@/components/shared/motion";

const steps = [
  {
    icon: UploadCloud,
    title: "Upload your documents",
    description:
      "Drag in judgments, contracts, circulars, or entire matters. Any format, any length — including scanned files via OCR.",
  },
  {
    icon: Wand2,
    title: "Let AI do the reading",
    description:
      "BriefVault structures every page: summaries, facts, arguments, holdings, risks, deadlines, and compliance items — all citation-backed.",
  },
  {
    icon: Rocket,
    title: "Act with confidence",
    description:
      "Ask questions, compare versions, track deadlines, and export polished client reports in a click.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" muted>
      <Container>
        <SectionHeader
          eyebrow="How It Works"
          title="Value on day one, in three simple steps."
          description="No lengthy setup or training. Upload a document and get answers in under a minute."
        />
        <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal
              key={step.title}
              className="relative rounded-lg border border-border bg-card p-7 shadow-soft"
            >
              <span className="absolute right-6 top-6 text-5xl font-bold text-muted">
                0{index + 1}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
                <step.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </Reveal>
          ))}
        </StaggerGroup>
      </Container>
    </Section>
  );
}
