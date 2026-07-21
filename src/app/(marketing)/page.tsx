import { Hero } from "@/components/landing/hero/hero";
import { Problem } from "@/components/landing/sections/problem";
import { Solution } from "@/components/landing/sections/solution";
import { FeaturesGrid } from "@/components/landing/sections/features-grid";
import { PlatformModules } from "@/components/landing/sections/platform-modules";
import { HowItWorks } from "@/components/landing/sections/how-it-works";
import { WhyBriefVault } from "@/components/landing/sections/why-briefvault";
import { Benefits } from "@/components/landing/sections/benefits";
import { Testimonials } from "@/components/landing/testimonial/testimonials";
import { Faq } from "@/components/landing/faq/faq";
import { CTA } from "@/components/landing/sections/cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <FeaturesGrid />
      <PlatformModules />
      <HowItWorks />
      <WhyBriefVault />
      <Benefits />
      <Testimonials />
      <Faq />
      <CTA />
    </>
  );
}
