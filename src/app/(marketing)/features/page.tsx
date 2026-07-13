import type { Metadata } from "next";
import { DetailedFeatureRow } from "@/components/landing/sections/detailed-feature";
import { CTA } from "@/components/landing/sections/cta";
import { Container } from "@/components/shared/container";
import { detailedFeatures } from "@/data/features";

export const metadata: Metadata = {
  title: "Features",
  description:
    "AI summaries, legal intelligence, Ask AI, document comparison, compliance, risk analysis, timelines, reports, OCR, search, and enterprise features.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return (
    <>
      <div className="pt-24 sm:pt-32 divide-y divide-border">
        {detailedFeatures.map((feature, index) => (
          <DetailedFeatureRow key={feature.id} feature={feature} index={index} />
        ))}
      </div>

      <Container className="pb-4">
        <div className="border-t border-border" />
      </Container>
      <CTA />
    </>
  );
}
