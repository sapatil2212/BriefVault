import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { PageHero } from "@/components/shared/page-hero";
import { siteConfig } from "@/constants/site";

export const metadata: Metadata = {
  title: "Cookie Policy | BriefVault",
  description:
    "Cookie policy and website tracking guidelines for BriefVault cloud platform by Brightwave Digital Products.",
  alternates: { canonical: "/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy & Tracking"
        title="Cookie Policy"
        description="Effective Date: July 1, 2026 | Last Updated: July 13, 2026"
      />

      <Section className="pt-4 pb-20">
        <Container size="narrow">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">1. What Are Cookies</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                This Cookie Policy explains how <strong>BriefVault</strong> (owned by <strong>Brightwave Digital Products</strong>) uses cookies and similar session storage technologies to recognize you when you visit our website at {siteConfig.url} or sign into your legal intelligence dashboard.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">2. Types of Cookies We Use</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                <li><strong>Essential Account Cookies:</strong> Required to authenticate users, maintain secure active user sessions, and store workspace preferences.</li>
                <li><strong>Performance & Preference Cookies:</strong> Used to remember UI theme preference (Light/Dark mode) and sidebar state.</li>
                <li><strong>Security Cookies:</strong> Required to prevent CSRF vulnerabilities, validate authorization tokens, and prevent automated bot access.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">3. Managing Cookies</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Most web browsers allow you to modify your cookie preferences through settings. Note that disabling essential cookies may prevent you from logging into your workspace or executing document processing actions.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/40 p-6">
              <h2 className="text-xl font-bold text-foreground">4. Contact Us</h2>
              <div className="mt-4 space-y-1.5 text-sm text-foreground font-medium">
                <p>Entity: <strong>Brightwave Digital Products (BriefVault)</strong></p>
                <p>Email: <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">{siteConfig.email}</a></p>
                <p>Phone: <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">{siteConfig.phone}</a></p>
                <p>Address: <strong>Pune, Maharashtra, India</strong></p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
