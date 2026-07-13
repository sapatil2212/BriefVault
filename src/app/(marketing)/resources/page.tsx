import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileText, HelpCircle, Newspaper, GraduationCap, LifeBuoy, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { StaggerGroup, Reveal } from "@/components/shared/motion";
import { Badge } from "@/components/ui/badge";
import { Faq } from "@/components/landing/faq/faq";
import { CTA } from "@/components/landing/sections/cta";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Guides, documentation, FAQs, and the BriefVault blog — resources to help you get the most out of legal AI.",
  alternates: { canonical: "/resources" },
};

const resources = [
  { icon: Newspaper, title: "Blog", description: "Insights on legal AI, product updates, and best practices.", soon: true },
  { icon: BookOpen, title: "Documentation", description: "Guides and references for getting the most from BriefVault.", soon: true },
  { icon: HelpCircle, title: "FAQs", description: "Answers to the most common questions about the platform.", soon: false },
  { icon: GraduationCap, title: "Academy", description: "Short courses to level up your team on legal AI workflows.", soon: true },
  { icon: FileText, title: "Case Studies", description: "How teams like yours reclaim their time with BriefVault.", soon: true },
  { icon: LifeBuoy, title: "Support Center", description: "Get help from our team whenever you need it.", soon: true },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Everything you need to master legal AI."
        description="From documentation to hands-on guides, our resources help your team get value from BriefVault faster. More is on the way."
      />

      <Section className="pt-4">
        <Container>
          <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Reveal
                key={resource.title}
                className="group relative flex flex-col rounded-lg border border-border bg-card p-6 shadow-soft transition-all hover:border-primary/30 hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <resource.icon className="h-5 w-5" />
                  </span>
                  {resource.soon && <Badge variant="muted">Coming soon</Badge>}
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {resource.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {resource.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  {resource.soon ? "In progress" : "Read the FAQs"}
                  {!resource.soon && <ArrowRight className="h-4 w-4" />}
                </span>
              </Reveal>
            ))}
          </StaggerGroup>

          <Reveal className="mt-14 overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40 p-10 text-center">
            <h3 className="text-xl font-semibold text-foreground">
              More resources are on the way.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              We&apos;re building out our library of guides and case studies. In the meantime,
              our team is happy to help directly.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
            >
              Talk to our team
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </Container>
      </Section>

      <Faq muted />
      <CTA />
    </>
  );
}
