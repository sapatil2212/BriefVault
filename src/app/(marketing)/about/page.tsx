import type { Metadata } from "next";
import { Target, Eye, Cpu, Sparkles, ShieldCheck, HeartHandshake, Scale, Users } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { Section, SectionHeader } from "@/components/shared/section";
import { StaggerGroup, Reveal } from "@/components/shared/motion";
import { CTA } from "@/components/landing/sections/cta";

export const metadata: Metadata = {
  title: "About",
  description:
    "Our mission, vision, story, technology, and the values behind BriefVault — the AI-powered legal intelligence platform.",
  alternates: { canonical: "/about" },
};

const values = [
  { icon: ShieldCheck, title: "Trust by design", description: "Every answer is grounded and citation-backed. We never ask you to take AI on faith." },
  { icon: Scale, title: "Built for the law", description: "We understand the stakes of legal work and engineer for precision, not novelty." },
  { icon: HeartHandshake, title: "Customer obsession", description: "We win when our customers reclaim their time and serve their clients better." },
  { icon: Users, title: "Humans in the loop", description: "AI augments expert judgment — it never replaces the professional behind the work." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="We're building the intelligence layer for legal work."
        description="BriefVault exists to give legal and compliance professionals their time back — turning the world's densest documents into clear, trustworthy answers."
      />

      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal className="rounded-2xl border border-border bg-card p-8 shadow-soft">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold text-foreground">Our Mission</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                To make legal knowledge instantly accessible and actionable — so
                professionals spend their time advising, not reading. We turn hours of
                document review into minutes of confident decisions.
              </p>
            </Reveal>
            <Reveal className="rounded-2xl border border-border bg-card p-8 shadow-soft">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Eye className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold text-foreground">Our Vision</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                A world where no deadline is missed, no clause is overlooked, and no
                professional is buried under paperwork — where AI handles the reading so
                humans can focus on judgment.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container size="narrow">
          <SectionHeader
            eyebrow="Our Story"
            title="Born from hours lost to documents."
          />
          <Reveal className="mt-10 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              BriefVault began when our founders — a lawyer and an ML engineer — watched
              a team spend an entire weekend reading a single arbitration award. The
              insight was simple: the value wasn&apos;t in reading every page, it was in
              understanding what mattered.
            </p>
            <p>
              So we built a platform that reads like a senior associate and answers like
              one too — always with a citation, never with a guess. What started as an
              internal tool is now trusted by law firms, banks, and corporate legal teams
              around the world.
            </p>
            <p>
              Today, BriefVault analyzes millions of documents, but our north star hasn&apos;t
              changed: give professionals their time back, and never ask them to trust an
              answer they can&apos;t verify.
            </p>
          </Reveal>
        </Container>
      </Section>



      <Section>
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal className="rounded-2xl border border-border bg-card p-8 shadow-soft">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Cpu className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold text-foreground">Our Technology</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                BriefVault combines retrieval-augmented generation with models tuned on
                the structure of judgments, statutes, and contracts. Every output is
                traced back to its source, with high-accuracy OCR, semantic search, and a
                citation graph underneath.
              </p>
            </Reveal>
            <Reveal className="rounded-2xl border border-border bg-card p-8 shadow-soft">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <Sparkles className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold text-foreground">Why AI</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Legal documents are growing faster than any team can read them. AI is the
                only way to keep pace — but only if it&apos;s grounded and verifiable.
                That&apos;s the bar we hold ourselves to: AI that earns trust, one citation
                at a time.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="Our Values"
            title="What we stand for."
          />
          <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Reveal
                key={value.title}
                className="rounded-lg border border-border bg-card p-6 shadow-soft"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <value.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </Reveal>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      <CTA />
    </>
  );
}
