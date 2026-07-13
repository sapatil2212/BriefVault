import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { PageHero } from "@/components/shared/page-hero";
import { siteConfig } from "@/constants/site";

export const metadata: Metadata = {
  title: "Privacy Policy | BriefVault",
  description:
    "Learn how BriefVault (Brightwave Digital Products) collects, uses, and protects your personal and document data.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal & Compliance"
        title="Privacy Policy"
        description="Effective Date: July 1, 2026 | Last Updated: July 13, 2026"
      />

      <Section className="pt-4 pb-20">
        <Container size="narrow">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">1. Introduction & Entity Details</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Welcome to <strong>BriefVault</strong>, an AI-powered legal intelligence platform owned and operated by <strong>Brightwave Digital Products</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), headquartered in <strong>Pune, Maharashtra, India</strong>. We respect your privacy and are committed to protecting the personal data and documents you upload to our platform.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">2. Information We Collect</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We collect information necessary to provide and improve our SaaS services:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                <li><strong>Account Data:</strong> Name, work email address, phone number, organization name, and billing details provided during registration or subscription upgrade.</li>
                <li><strong>Uploaded User Content:</strong> Legal documents, contracts, notifications, judgments, and text input submitted for AI analysis, extraction, and search.</li>
                <li><strong>Technical & Usage Log Data:</strong> IP address, browser type, device identifiers, session activity, and interaction timestamps.</li>
                <li><strong>Payment Transaction Identifiers:</strong> Payment confirmation status and transaction references processed securely via authorized third-party payment gateways. (We do not store complete credit card or debit card numbers on our servers).</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">3. How We Use Your Information</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use collected information strictly for legitimate service delivery:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                <li>To provision and manage your BriefVault workspace account.</li>
                <li>To process text extraction, OCR, legal summarization, and AI Q&A workflows requested by you.</li>
                <li>To bill subscription fees and send transaction invoices/confirmations.</li>
                <li>To enforce security controls, prevent unauthorized access, and fulfill audit requirements.</li>
                <li>To respond to customer support inquiries submitted to {siteConfig.email}.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">4. Document Confidentiality & AI Data Processing</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your uploaded legal files and documents are held in strict confidence. We do <strong>NOT</strong> sell your uploaded documents, nor do we use your private confidential document text to train foundational public LLM models. All vector index embeddings and uploaded document caches are segmented per workspace user.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">5. Data Retention & Deletion</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You retain full ownership of your data. You may delete individual documents or clear workspace history at any time from your dashboard. Upon written request or account termination, your uploaded assets are permanently purged from active server storage within 30 days.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">6. Third-Party Service Providers</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We share data with trusted infrastructure providers (cloud hosting, database management, LLM inference API endpoints, and payment processing gateways) strictly bound by data protection agreements and confidentiality terms.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">7. Security Measures</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We employ industry-standard encryption in transit (TLS 1.3) and at rest (AES-256), multi-tenant access controls, role-based security policies, and continuous monitoring to guard your information against unauthorized disclosure.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/40 p-6">
              <h2 className="text-xl font-bold text-foreground">8. Contact & Grievance Officer</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                For questions regarding this Privacy Policy, data access requests, or privacy concerns, please contact our privacy desk:
              </p>
              <div className="mt-4 space-y-1.5 text-sm text-foreground font-medium">
                <p>Entity: <strong>Brightwave Digital Products (BriefVault)</strong></p>
                <p>Address: <strong>Pune, Maharashtra, India</strong></p>
                <p>Email: <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">{siteConfig.email}</a></p>
                <p>Phone: <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">{siteConfig.phone}</a></p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
