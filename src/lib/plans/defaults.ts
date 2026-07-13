import type { PlanFeatureFlags, PlanKey, PlanLimits } from "@/lib/plans/types";

/**
 * Seed definitions for the four launch plans. These are used to lazily seed the
 * `Plan` table on first read (see lib/plans/service). Once seeded, the database
 * is the source of truth — editing a plan in the DB overrides these defaults.
 */
export interface PlanSeed {
  key: PlanKey;
  name: string;
  tagline: string;
  priceMonthly: number;
  currency: string;
  requiresApproval: boolean;
  isPopular: boolean;
  sortOrder: number;
  limits: PlanLimits;
  features: string[];
  featureFlags: PlanFeatureFlags;
}

const NO_FLAGS: PlanFeatureFlags = {
  executiveSummary: false,
  quickSummary: false,
  keyHighlights: false,
  importantDates: false,
  timeline: false,
  caseFacts: false,
  arguments: false,
  finalDecision: false,
  riskAnalysis: false,
  compliance: false,
  multiLanguage: false,
  comparison: false,
  knowledgeBase: false,
  teamCollaboration: false,
  apiAccess: false,
  auditLogs: false,
  smartTags: false,
};

export const PLAN_SEEDS: PlanSeed[] = [
  {
    key: "FREE",
    name: "Free",
    tagline: "Demo / trial — explore BriefVault with a single document.",
    priceMonthly: 0,
    currency: "INR",
    requiresApproval: false,
    isPopular: false,
    sortOrder: 0,
    limits: { documentsPerMonth: 1, pagesPerDocument: 20, aiQuestions: 5, storageMb: 500, users: 1 },
    features: [
      "1 document",
      "Up to 20 pages",
      "Executive summary",
      "One-page summary",
      "Quick summary",
      "Key highlights",
      "Basic AI report",
      "5 AI questions",
      "500 MB storage",
      "Single user",
    ],
    featureFlags: {
      ...NO_FLAGS,
      executiveSummary: true,
      quickSummary: true,
      keyHighlights: true,
    },
  },
  {
    key: "STARTER",
    name: "Starter",
    tagline: "For solo practitioners getting started with AI.",
    priceMonthly: 999,
    currency: "INR",
    requiresApproval: true,
    isPopular: false,
    sortOrder: 1,
    limits: { documentsPerMonth: 10, pagesPerDocument: 50, aiQuestions: 20, storageMb: 2048, users: 1 },
    features: [
      "10 documents / month",
      "50 pages per document",
      "Executive summary",
      "One-page summary",
      "Quick summary",
      "Key highlights",
      "Important dates",
      "Basic reports",
      "20 AI questions",
      "2 GB storage",
    ],
    featureFlags: {
      ...NO_FLAGS,
      executiveSummary: true,
      quickSummary: true,
      keyHighlights: true,
      importantDates: true,
    },
  },
  {
    key: "PROFESSIONAL",
    name: "Professional",
    tagline: "For growing firms that need the full intelligence suite.",
    priceMonthly: 1499,
    currency: "INR",
    requiresApproval: true,
    isPopular: true,
    sortOrder: 2,
    limits: { documentsPerMonth: 50, pagesPerDocument: 100, aiQuestions: 200, storageMb: 20480, users: -1 },
    features: [
      "50 documents / month",
      "100 pages per document",
      "Advanced AI analysis",
      "Timeline",
      "Case facts",
      "Arguments",
      "Final decision",
      "Risk analysis",
      "Compliance reports",
      "Multi-language",
      "200 AI questions",
      "20 GB storage",
    ],
    featureFlags: {
      ...NO_FLAGS,
      executiveSummary: true,
      quickSummary: true,
      keyHighlights: true,
      importantDates: true,
      timeline: true,
      caseFacts: true,
      arguments: true,
      finalDecision: true,
      riskAnalysis: true,
      compliance: true,
      multiLanguage: true,
      comparison: true,
    },
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    tagline: "For organizations with advanced security and scale needs.",
    priceMonthly: 4999,
    currency: "INR",
    requiresApproval: true,
    isPopular: false,
    sortOrder: 3,
    limits: { documentsPerMonth: 100, pagesPerDocument: 300, aiQuestions: -1, storageMb: 102400, users: -1 },
    features: [
      "100 documents / month",
      "300 pages per document",
      "Complete AI platform",
      "Unlimited AI reports (fair usage)",
      "Unlimited AI questions (fair usage)",
      "AI knowledge base",
      "Team collaboration",
      "API access",
      "Audit logs",
      "Smart tags",
      "Enterprise security",
      "100 GB storage",
    ],
    featureFlags: {
      executiveSummary: true,
      quickSummary: true,
      keyHighlights: true,
      importantDates: true,
      timeline: true,
      caseFacts: true,
      arguments: true,
      finalDecision: true,
      riskAnalysis: true,
      compliance: true,
      multiLanguage: true,
      comparison: true,
      knowledgeBase: true,
      teamCollaboration: true,
      apiAccess: true,
      auditLogs: true,
      smartTags: true,
    },
  },
];
