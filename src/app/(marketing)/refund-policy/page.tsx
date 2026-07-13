import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { PageHero } from "@/components/shared/page-hero";
import { siteConfig } from "@/constants/site";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | BriefVault",
  description:
    "Refund and cancellation terms for BriefVault SaaS plans operated by Brightwave Digital Products.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Billing Policy"
        title="Refund & Cancellation Policy"
        description="Effective Date: July 1, 2026 | Last Updated: July 13, 2026"
      />

      <Section className="pt-4 pb-20">
        <Container size="narrow">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">1. Subscription Cancellation</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                At <strong>BriefVault</strong> (operated by <strong>Brightwave Digital Products</strong>), you may cancel your paid subscription plan at any time through your Account Settings or by emailing <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">{siteConfig.email}</a>. Upon cancellation, your subscription will remain active until the conclusion of your current prepaid billing cycle, after which no further automatic recurring payments will be charged.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">2. Refund Terms</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                As BriefVault provides immediate digital access to web-based SaaS intelligence features, cloud server processing capacity, and OCR resources upon plan selection:
              </p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                <li><strong>First-Time Purchases (7-Day Review Period):</strong> If you are unsatisfied with your initial paid plan within 7 calendar days of subscription activation and have processed fewer than 3 document analysis briefs, you are eligible for a full refund.</li>
                <li><strong>Renewal Payments:</strong> Renewal charges for subsequent billing cycles are non-refundable once initiated. Customers are encouraged to request cancellation prior to the scheduled renewal date.</li>
                <li><strong>Unused Quotas:</strong> Partial monthly billing cycles or unused document upload limits are non-refundable and non-transferable.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">3. Processing Approved Refunds</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Approved refund requests are processed within <strong>5 to 7 business days</strong>. Refunds will be credited back exclusively to the original payment instrument (credit card, debit card, net banking, or UPI account) used during initial checkout through our payment gateway partners.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">4. Duplicate Charges & Billing Errors</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                In the event of an accidental double charge or payment error caused by server or gateway issues, please notify us immediately at <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">{siteConfig.email}</a> with your transaction ID. Verified duplicate transactions will be fully refunded within 3 to 5 business days.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/40 p-6">
              <h2 className="text-xl font-bold text-foreground">5. Requesting a Refund</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                To submit a refund or billing inquiry, please reach out with your registered account details:
              </p>
              <div className="mt-4 space-y-1.5 text-sm text-foreground font-medium">
                <p>Company: <strong>Brightwave Digital Products (BriefVault)</strong></p>
                <p>Email: <a href={`mailto:${siteConfig.email}`} className="text-primary hover:underline">{siteConfig.email}</a></p>
                <p>Phone: <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">{siteConfig.phone}</a></p>
                <p>Location: <strong>Pune, Maharashtra, India</strong></p>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
