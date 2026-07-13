import type { PricingPlan } from "@/types";

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    tagline: "For solo practitioners and small teams getting started with AI.",
    cta: "Contact Sales",
    features: [
      "Up to 5 users",
      "AI summaries & Ask AI",
      "Timeline & risk flags",
      "Standard OCR",
      "Email support",
      "Up to 500 documents / month",
    ],
  },
  {
    name: "Professional",
    tagline: "For growing firms that need the full intelligence suite.",
    highlight: true,
    cta: "Contact Sales",
    features: [
      "Up to 50 users",
      "Everything in Starter",
      "Document comparison",
      "Compliance checklists",
      "Branded client reports",
      "Priority support",
      "Unlimited documents",
    ],
  },
  {
    name: "Enterprise",
    tagline: "For organizations with advanced security and scale needs.",
    cta: "Contact Sales",
    features: [
      "Unlimited users",
      "Everything in Professional",
      "SSO / SAML & SCIM",
      "Data residency & private deployment",
      "SOC 2 report & DPA",
      "Dedicated success manager",
      "99.9% uptime SLA",
    ],
  },
];
