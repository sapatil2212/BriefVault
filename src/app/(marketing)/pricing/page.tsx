import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { Container } from "@/components/shared/container";
import { Section, SectionHeader } from "@/components/shared/section";
import { StaggerGroup, Reveal } from "@/components/shared/motion";
import { PricingCard } from "@/components/landing/pricing-card/pricing-card";
import { ComparisonTable } from "@/components/landing/pricing-card/comparison-table";
import { Faq } from "@/components/landing/faq/faq";
import { CTA } from "@/components/landing/sections/cta";
import { getPublicPlans } from "@/lib/plans/service";
import { formatPlanPrice } from "@/lib/plans/types";
import type { PricingPlan } from "@/types";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent plans for teams of every size — Free, Starter, Professional, and Enterprise.",
  alternates: { canonical: "/pricing" },
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await getPublicPlans();
  const pricingPlans: PricingPlan[] = plans.map((p) => ({
    name: p.name,
    tagline: p.tagline,
    highlight: p.isPopular,
    features: p.features,
    cta: p.priceMonthly > 0 ? "Get started" : "Start free",
    priceLabel: formatPlanPrice(p.priceMonthly, p.currency),
    pricePeriod: p.priceMonthly > 0 ? "/ month" : undefined,
    href: "/signup",
  }));

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Plans that scale with your team."
        description="From solo practitioners to global enterprises. Every plan includes citation-backed AI and enterprise-grade security."
      />

      <Section className="pt-4">
        <Container>
          <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} />
            ))}
          </StaggerGroup>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Prices shown are per month. The Free plan activates instantly; paid plans are
            reviewed by our team before access is granted.
          </p>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="Compare"
            title="Find the right plan."
            description="A detailed look at what's included in every plan."
          />
          <Reveal className="mt-12">
            <ComparisonTable plans={plans} />
          </Reveal>
        </Container>
      </Section>

      <Faq muted={false} />
      <CTA />
    </>
  );
}
