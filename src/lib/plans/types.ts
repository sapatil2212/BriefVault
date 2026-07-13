/**
 * Plan configuration contracts. Plans live in the database (see the `Plan`
 * model) but their JSON `limits` / `featureFlags` follow these shapes so the
 * rest of the app has a typed view. New dimensions can be added here without a
 * schema migration — the DB columns are plain JSON.
 */

/** Canonical plan identifiers. Stored as `Plan.key`. */
export const PLAN_KEYS = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

/** A value of `-1` means "unlimited (fair usage)"; `null` means "not offered". */
export interface PlanLimits {
  documentsPerMonth: number; // -1 = unlimited
  pagesPerDocument: number;
  aiQuestions: number; // -1 = unlimited
  storageMb: number;
  users: number; // -1 = unlimited
}

/** Capability flags used to gate features in the dashboard/sidebar. */
export interface PlanFeatureFlags {
  executiveSummary: boolean;
  quickSummary: boolean;
  keyHighlights: boolean;
  importantDates: boolean;
  timeline: boolean;
  caseFacts: boolean;
  arguments: boolean;
  finalDecision: boolean;
  riskAnalysis: boolean;
  compliance: boolean;
  multiLanguage: boolean;
  comparison: boolean;
  knowledgeBase: boolean;
  teamCollaboration: boolean;
  apiAccess: boolean;
  auditLogs: boolean;
  smartTags: boolean;
}

/** Public, serializable plan shape returned to clients (marketing + signup). */
export interface PublicPlan {
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

/** Format a plan price for display, e.g. ₹0 → "Free", 999 → "₹999". */
export function formatPlanPrice(priceMonthly: number, currency = "INR"): string {
  if (priceMonthly <= 0) return "Free";
  const symbol = currency === "INR" ? "₹" : currency + " ";
  return `${symbol}${priceMonthly.toLocaleString("en-IN")}`;
}

/** Human label for a limit value, treating -1 as unlimited. */
export function formatLimit(value: number, unit = ""): string {
  if (value < 0) return "Unlimited";
  return unit ? `${value.toLocaleString("en-IN")} ${unit}` : value.toLocaleString("en-IN");
}
