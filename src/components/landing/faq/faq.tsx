import Link from "next/link";
import { Section, SectionHeader } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/data/content";
import type { FaqItem } from "@/types";

export function Faq({
  items = faqs,
  muted = true,
}: {
  items?: FaqItem[];
  muted?: boolean;
}) {
  return (
    <Section id="faq" muted={muted}>
      <Container size="narrow">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions, answered."
          description="Everything you need to know about BriefVault. Can't find what you're looking for?"
        />
        <Reveal className="mt-12">
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Still have questions?{" "}
          <Link href="/contact" className="font-semibold text-primary hover:underline">
            Talk to our team
          </Link>
        </p>
      </Container>
    </Section>
  );
}
