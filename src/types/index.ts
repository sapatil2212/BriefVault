import type { LucideIcon } from "lucide-react";

export interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface DetailedFeature extends Feature {
  points: string[];
  badge?: string;
}

export interface Solution {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  outcomes: string[];
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

export interface PricingPlan {
  name: string;
  tagline: string;
  highlight?: boolean;
  features: string[];
  cta: string;
  /** Formatted price, e.g. "₹999" or "Free". When omitted the card shows "Custom". */
  priceLabel?: string;
  /** Billing period suffix, e.g. "/ month". */
  pricePeriod?: string;
  /** CTA destination. Defaults to /contact. */
  href?: string;
}

export interface WorkflowStep {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}
