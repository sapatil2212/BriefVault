import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { PageHero } from "@/components/shared/page-hero";
import { siteConfig } from "@/constants/site";

export const metadata: Metadata = {
  title: "Terms & Conditions | BriefVault",
  description:
    "Terms and conditions governing subscription usage of the BriefVault legal intelligence platform.",
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsAndConditionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal Agreement"
        title="Terms & Conditions"
        description="Effective Date: July 1, 2026 | Last Updated: July 13, 2026"
      />

      <Section className="pt-4 pb-20">
        <Container size="narrow">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                These Terms &amp; Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot; or &quot;Customer&quot;) and <strong>Brightwave Digital Products LLP</strong> (&quot;Company&quot;, &quot;we&quot;, or &quot;our&quot;), governing your access to and use of <strong>BriefVault</strong> ({siteConfig.url}). By registering, creating an account, or subscribing to any plan, you agree to comply fully with these Terms.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">2. Description of Services</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                BriefVault provides cloud-based software-as-a-service (SaaS) features for legal document analysis, text extraction, OCR, citation-backed query responses, risk highlighting, and document organization.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">3. Account Eligibility & Responsibilities</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                <li>You must be at least 18 years of age or a registered legal entity to purchase plans or use the platform.</li>
                <li>You are responsible for maintaining the confidentiality of your credentials and all activities conducted under your workspace account.</li>
                <li>You agree to provide accurate, current, and complete business information during checkout.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">4. Subscription Terms & Payments</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                <li>BriefVault offers subscription packages (Free, Starter, Professional, Enterprise) subject to set document upload and feature limits.</li>
                <li>Paid plans are billed in Indian Rupees (INR) or applicable local currency monthly or annually via authorized payment gateways.</li>
                <li>Subscriptions automatically renew at the end of each billing window unless cancelled prior to renewal date via your dashboard.</li>
                <li>Certain tiers (e.g. Starter, Professional, Enterprise) may require administrative review prior to full plan activation.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">5. Intellectual Property & Document Ownership</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You retain sole copyright and proprietary ownership over all original documents uploaded to your BriefVault workspace. All technology, code, user interface designs, logos, trademarks, and AI analysis models remain the exclusive property of Brightwave Digital Products LLP.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">6. Disclaimer of Legal Advice</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>IMPORTANT:</strong> BriefVault is an AI document assistance and legal workflow productivity tool. Output provided by BriefVault does <strong>NOT</strong> constitute professional legal counsel, binding attorney advice, or formal legal opinions. Users must independently verify generated summaries and citations before court filings or execution of legal instruments.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">7. Prohibited Conduct</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You agree not to upload illegal or malicious files, reverse-engineer the application codebase, circumvent account document quotas, or attempt unauthorized access to multi-tenant servers.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">8. Governing Law & Jurisdiction</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                These Terms are governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the courts located in <strong>Pune, Maharashtra, India</strong>.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/40 p-6">
              <h2 className="text-xl font-bold text-foreground">9. Contact Us</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                For questions regarding these Terms &amp; Conditions, please reach out to us:
              </p>
              <div className="mt-4 space-y-1.5 text-sm text-foreground font-medium">
                <p>Company: <strong>Brightwave Digital Products LLP</strong></p>
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
