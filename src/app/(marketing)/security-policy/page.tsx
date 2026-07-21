import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { PageHero } from "@/components/shared/page-hero";
import { siteConfig } from "@/constants/site";

export const metadata: Metadata = {
  title: "Security Policy | BriefVault",
  description:
    "Data encryption, infrastructure protection, and vulnerability disclosure guidelines for BriefVault cloud platform.",
  alternates: { canonical: "/security-policy" },
};

export default function SecurityPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Trust & Safety"
        title="Security Policy"
        description="Effective Date: July 1, 2026 | Last Updated: July 13, 2026"
      />

      <Section className="pt-4 pb-20">
        <Container size="narrow">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">1. Our Commitment to Security</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                At <strong>BriefVault</strong> (developed and owned by <strong>Brightwave Digital Products LLP</strong>), security is foundational to everything we build. Legal teams rely on BriefVault to process confidential contracts, briefs, and filings. We maintain rigorous technical and operational controls to safeguard your data.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">2. Architecture & Data Encryption</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                <li><strong>Encryption in Transit:</strong> All HTTP traffic and API communications are encrypted using Transport Layer Security (TLS).</li>
                <li><strong>Password Security:</strong> Account passwords are hashed (bcrypt) and never stored or transmitted in plain text.</li>
                <li><strong>Account-Level Isolation:</strong> Access controls ensure your documents and workspace data are scoped to your account and not visible to other users.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">3. Payment Gateway Security Compliance</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All checkout transactions are handled directly by PCI-DSS Level 1 compliant payment gateways (Razorpay / Stripe). BriefVault never stores, processes, or transmits raw credit card numbers or banking PINs on its own application servers.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">4. Vulnerability Reporting</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you believe you have discovered a potential security vulnerability or issue in BriefVault, please report it to our security desk at <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">{siteConfig.email}</a>. We respond to security disclosures within 24 business hours.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/40 p-6">
              <h2 className="text-xl font-bold text-foreground">5. Security Support Desk</h2>
              <div className="mt-4 space-y-1.5 text-sm text-foreground font-medium">
                <p>Entity: <strong>Brightwave Digital Products LLP (BriefVault)</strong></p>
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
