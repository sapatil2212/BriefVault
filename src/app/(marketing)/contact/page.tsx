import type { Metadata } from "next";
import {
  Phone,
  Mail,
  Globe,
  Sparkles,
  GitCompare,
  ShieldCheck,
  Bot,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Reveal } from "@/components/shared/motion";
import { ContactForm } from "@/components/landing/contact/contact-form";
import { siteConfig } from "@/constants/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Book a demo or talk to our team. See BriefVault work on your own documents with a guided pilot.",
  alternates: { canonical: "/contact" },
};

const platformFeatures = [
  {
    icon: Sparkles,
    title: "AI Summaries & Insights",
    desc: "Executive briefs, key highlights, and automatic legal section analysis.",
  },
  {
    icon: GitCompare,
    title: "Document Comparison",
    desc: "Redline contract versions, agreements, and track structural changes.",
  },
  {
    icon: ShieldCheck,
    title: "Risk & Compliance Audits",
    desc: "Surface obligations, penalties, deadlines, and liability exposure.",
  },
  {
    icon: Bot,
    title: "Citation-Backed Assistant",
    desc: "Ask any question with direct page and clause references.",
  },
];

export default function ContactPage() {
  return (
    <Section className="pt-24 sm:pt-28 pb-20">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Left Card: Contact Information + Platform Features */}
          <Reveal className="lg:col-span-5 flex flex-col">
            <div className="h-full flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-card backdrop-blur-sm">
              {/* Top: Contact Information */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Contact Information
                </h2>

                <div className="mt-6 space-y-4">
                  {/* Phone */}
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-3.5 group"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-105">
                      <Phone className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        CONTACT
                      </p>
                      <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                        {siteConfig.phone}
                      </p>
                    </div>
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:${siteConfig.salesEmail}`}
                    className="flex items-center gap-3.5 group"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 transition-transform group-hover:scale-105">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        EMAIL
                      </p>
                      <p className="text-sm font-semibold text-foreground group-hover:text-teal-600 transition-colors">
                        {siteConfig.salesEmail}
                      </p>
                    </div>
                  </a>

                  {/* Location */}
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Globe className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        LOCATION
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {siteConfig.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Divider */}
              <div className="my-6 border-t border-border/60" />

              {/* Bottom: Platform Features */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Platform Features
                </h3>

                <div className="mt-5 space-y-4">
                  {platformFeatures.map((feat) => (
                    <div key={feat.title} className="flex items-start gap-3.5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80">
                        <feat.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                          {feat.title}
                        </h4>
                        <p className="mt-0.5 text-[11px] leading-normal text-muted-foreground">
                          {feat.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right Card: Book a Demo Form */}
          <Reveal
            className="lg:col-span-7 flex flex-col"
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 } },
            }}
          >
            <div className="h-full flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-card backdrop-blur-sm">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Book a demo
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Pick a time and we&apos;ll confirm via email.
                </p>
              </div>

              <div className="mt-6 flex-1">
                <ContactForm />
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
