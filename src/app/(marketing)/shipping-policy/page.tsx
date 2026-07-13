import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { PageHero } from "@/components/shared/page-hero";
import { siteConfig } from "@/constants/site";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | BriefVault",
  description:
    "Digital delivery and service activation guidelines for BriefVault cloud platform by Brightwave Digital Products.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Fulfillment Terms"
        title="Shipping & Delivery Policy"
        description="Effective Date: July 1, 2026 | Last Updated: July 13, 2026"
      />

      <Section className="pt-4 pb-20">
        <Container size="narrow">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/90">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">1. Digital Service Delivery</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                <strong>BriefVault</strong> operated by <strong>Brightwave Digital Products</strong> is a 100% digital software-as-a-service (SaaS) cloud application. We do <strong>NOT</strong> ship physical goods, hardware, CDs, or tangible paper materials to your physical address.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">2. Access Provisioning & Timelines</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                <li><strong>Instant Activation (Free Tier):</strong> Account registration and free tier allocation are activated instantly upon account verification.</li>
                <li><strong>Paid Subscriptions:</strong> Upon successful checkout through our authorized payment gateway partners, your account subscription plan limits, quota upgrades, and feature access are provisioned automatically within minutes.</li>
                <li><strong>Enterprise / Approval Tiers:</strong> For custom enterprise tiers or accounts requiring administrative compliance verification, workspace approval is completed within <strong>1 to 2 business hours</strong> (max 24 business hours).</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">3. Delivery Confirmation & Electronic Receipt</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upon transaction completion, an electronic tax invoice and subscription confirmation email containing your receipt and account details will be delivered automatically to your registered email address ({siteConfig.email}).
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">4. Support & Delivery Inquiries</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you encounter any delay in accessing your workspace features after completing payment, please verify your payment confirmation or contact our activation support desk immediately.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/40 p-6">
              <h2 className="text-xl font-bold text-foreground">5. Contact Information</h2>
              <div className="mt-4 space-y-1.5 text-sm text-foreground font-medium">
                <p>Company: <strong>Brightwave Digital Products (BriefVault)</strong></p>
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
