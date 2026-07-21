"use client";

import Image from "next/image";
import { Quote } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Marquee } from "@/components/shared/marquee";
import { testimonials } from "@/data/content";

export function Testimonials() {
  return (
    <Section id="testimonials">
      <Container>
        <div className="flex flex-col items-center mb-12 text-center">
          <SectionHeader
            align="center"
            eyebrow="Testimonials"
            title="Trusted by teams who can't afford to be wrong."
          />
        </div>

        <div className="mt-12 overflow-hidden">
          <Marquee duration="40s" pauseOnHover={true}>
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="mx-3 w-[350px] md:w-[380px] shrink-0"
              >
                <figure className="flex h-full flex-col rounded-lg border border-border bg-card p-7 shadow-soft">
                  <Quote className="h-8 w-8 text-primary/20 text-left" />
                  <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground text-left">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5 text-left">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.role}{t.company ? `, ${t.company}` : ""}
                      </p>
                    </div>
                  </figcaption>
                </figure>
              </div>
            ))}
          </Marquee>
        </div>
      </Container>
    </Section>
  );
}
