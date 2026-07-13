import "server-only";
import type { Plan, Subscription } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Subscription lifecycle helpers. A user has at most one Subscription row; it
 * is created at signup (PENDING) and activated either immediately (free plan)
 * or on admin approval (paid plans).
 */

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Compute the next renewal date one billing period from `from`. */
export function nextRenewal(from = new Date()): Date {
  return new Date(from.getTime() + MONTH_MS);
}

/**
 * Create or replace a user's pending subscription for the chosen plan. Used at
 * signup, before any approval decision.
 */
export async function createPendingSubscription(userId: string, planId: string): Promise<Subscription> {
  return prisma.subscription.upsert({
    where: { userId },
    create: { userId, planId, status: "PENDING" },
    update: { planId, status: "PENDING", startedAt: null, currentPeriodEnd: null, cancelledAt: null },
  });
}

/**
 * Activate a user's subscription for a plan, setting the billing window. Called
 * on free-plan verification and on admin approval of a paid plan.
 */
export async function activateSubscription(userId: string, planId: string): Promise<Subscription> {
  const now = new Date();
  return prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      planId,
      status: "ACTIVE",
      startedAt: now,
      currentPeriodEnd: nextRenewal(now),
    },
    update: {
      planId,
      status: "ACTIVE",
      startedAt: now,
      currentPeriodEnd: nextRenewal(now),
      cancelledAt: null,
    },
  });
}

/**
 * Reactivate a user's EXISTING subscription (keeping its current plan) when an
 * admin activates the account from the console. No-op if the user has no
 * subscription (legacy accounts) or it's already active. This keeps the
 * account's login-gating subscription status in sync with an admin's
 * "Activate" / status change, so activated users can actually sign in.
 */
export async function reactivateUserSubscription(userId: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || sub.status === "ACTIVE") return;
  const now = new Date();
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: "ACTIVE",
      startedAt: sub.startedAt ?? now,
      currentPeriodEnd: nextRenewal(now),
      cancelledAt: null,
    },
  });
}

/** Cancel a user's subscription (e.g. on rejection). */
export async function cancelSubscription(userId: string): Promise<void> {
  await prisma.subscription
    .update({ where: { userId }, data: { status: "CANCELLED", cancelledAt: new Date() } })
    .catch(() => undefined);
}

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan;
}

/** Fetch a user's subscription with its plan, or null. */
export async function getUserSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
  return prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
}

export interface SubscriptionOverview {
  plan: {
    key: string;
    name: string;
    priceMonthly: number;
    currency: string;
    features: string[];
  } | null;
  status: string | null;
  currentPeriodEnd: string | null;
  limits: { documentsPerMonth: number; pagesPerDocument: number; aiQuestions: number; storageMb: number; users: number } | null;
  usage: {
    documentsThisMonth: number;
    storageBytes: number;
  };
}

/** Everything the dashboard needs to render the subscription card + usage. */
export async function getSubscriptionOverview(userId: string): Promise<SubscriptionOverview> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [sub, documentsThisMonth, storageAgg] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId }, include: { plan: true } }),
    prisma.document.count({ where: { userId, deletedAt: null, createdAt: { gte: monthStart } } }),
    prisma.document.aggregate({ _sum: { sizeBytes: true }, where: { userId, deletedAt: null } }),
  ]);

  return {
    plan: sub
      ? {
          key: sub.plan.key,
          name: sub.plan.name,
          priceMonthly: sub.plan.priceMonthly,
          currency: sub.plan.currency,
          features: (sub.plan.features as unknown as string[]) ?? [],
        }
      : null,
    status: sub?.status ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
    limits: sub ? (sub.plan.limits as unknown as SubscriptionOverview["limits"]) : null,
    usage: {
      documentsThisMonth,
      storageBytes: storageAgg._sum.sizeBytes ?? 0,
    },
  };
}

export interface UploadCheckResult {
  allowed: boolean;
  reason?: "NO_SUBSCRIPTION" | "INACTIVE" | "DOCUMENT_LIMIT" | "STORAGE_LIMIT";
  message?: string;
  planName?: string;
  limit?: number;
  used?: number;
}

/**
 * Check whether a user is allowed to upload a new document given their active
 * plan limits. Returns { allowed: true } when OK, or a detailed error when not.
 * `fileSizeBytes` is optional — when provided, storage quota is also checked.
 */
export async function checkUploadAllowed(
  userId: string,
  fileSizeBytes = 0
): Promise<UploadCheckResult> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [sub, documentsThisMonth, storageAgg] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId }, include: { plan: true } }),
    prisma.document.count({ where: { userId, deletedAt: null, createdAt: { gte: monthStart } } }),
    prisma.document.aggregate({ _sum: { sizeBytes: true }, where: { userId, deletedAt: null } }),
  ]);

  if (!sub) {
    return { allowed: false, reason: "NO_SUBSCRIPTION", message: "No active subscription found. Please subscribe to a plan." };
  }
  if (sub.status !== "ACTIVE") {
    return { allowed: false, reason: "INACTIVE", message: "Your subscription is not active. Please contact support.", planName: sub.plan.name };
  }

  const limits = sub.plan.limits as unknown as SubscriptionOverview["limits"];
  if (!limits) {
    return { allowed: true };
  }

  // Check monthly document limit
  const docLimit = limits.documentsPerMonth;
  if (docLimit > 0 && documentsThisMonth >= docLimit) {
    return {
      allowed: false,
      reason: "DOCUMENT_LIMIT",
      message: `You've reached your ${sub.plan.name} plan limit of ${docLimit} document${docLimit === 1 ? "" : "s"} this month. Upgrade your plan to upload more.`,
      planName: sub.plan.name,
      limit: docLimit,
      used: documentsThisMonth,
    };
  }

  // Check storage limit
  const storageLimitBytes = limits.storageMb > 0 ? limits.storageMb * 1024 * 1024 : -1;
  const currentStorageBytes = storageAgg._sum.sizeBytes ?? 0;
  if (storageLimitBytes > 0 && (currentStorageBytes + fileSizeBytes) > storageLimitBytes) {
    const usedMb = Math.round(currentStorageBytes / (1024 * 1024));
    return {
      allowed: false,
      reason: "STORAGE_LIMIT",
      message: `Storage limit reached. Your ${sub.plan.name} plan includes ${limits.storageMb} MB storage (${usedMb} MB used). Upgrade to get more storage.`,
      planName: sub.plan.name,
      limit: limits.storageMb,
      used: usedMb,
    };
  }

  return { allowed: true };
}

// ─── Feature-flag & AI-question gating ──────────────────────────────────────

import type { PlanFeatureFlags } from "@/lib/plans/types";

/** Map analysis kind strings → featureFlag keys. */
const KIND_TO_FLAG: Record<string, keyof PlanFeatureFlags | null> = {
  EXECUTIVE_SUMMARY: "executiveSummary",
  ONE_PAGE_SUMMARY: "executiveSummary",
  QUICK_SUMMARY: "quickSummary",
  KEY_HIGHLIGHTS: "keyHighlights",
  TIMELINE: "timeline",
  CASE_FACTS: "caseFacts",
  QUESTIONS_BEFORE_COURT: "caseFacts",
  ARGUMENTS: "arguments",
  FINAL_DECISION: "finalDecision",
  RATIO_DECIDENDI: "finalDecision",
  OBITER_DICTA: "finalDecision",
  SECTIONS_OF_LAW: "caseFacts",
  CASE_CITATIONS: "caseFacts",
  IMPORTANT_PARAGRAPHS: "caseFacts",
  RISK_ANALYSIS: "riskAnalysis",
  COMPLIANCE_CHECKLIST: "compliance",
  ACTION_ITEMS: null, // available to all plans
  DEADLINES: "importantDates",
  MONETARY_INFO: null, // available to all plans
  COMPARISON: "comparison", // for the /api/ai/compare route
};

export interface FeatureCheckResult {
  allowed: boolean;
  reason?: "NO_SUBSCRIPTION" | "INACTIVE" | "FEATURE_GATED";
  message?: string;
  planName?: string;
  requiredPlan?: string;
}

/**
 * Check whether the user's active plan permits a specific analysis kind
 * (or any named feature flag). Pass `kind` from the analyzeSchema enum.
 */
export async function checkFeatureAllowed(
  userId: string,
  kind: string
): Promise<FeatureCheckResult> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (!sub) {
    return {
      allowed: false,
      reason: "NO_SUBSCRIPTION",
      message: "No active subscription found.",
    };
  }
  if (sub.status !== "ACTIVE") {
    return {
      allowed: false,
      reason: "INACTIVE",
      message: "Your subscription is not active.",
      planName: sub.plan.name,
    };
  }

  const flagKey = KIND_TO_FLAG[kind];
  if (flagKey === undefined) return { allowed: true }; // unknown kind — permit
  if (flagKey === null) return { allowed: true }; // explicitly unlocked for all

  const flags = (sub.plan.featureFlags ?? {}) as Partial<PlanFeatureFlags>;
  if (flags[flagKey] === true) return { allowed: true };

  // Identify minimum plan that unlocks this feature
  const PLAN_ORDER: Record<string, number> = { FREE: 0, STARTER: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };
  const FLAG_MINIMUM_PLAN: Record<keyof PlanFeatureFlags, string> = {
    executiveSummary: "FREE",
    quickSummary: "FREE",
    keyHighlights: "FREE",
    importantDates: "STARTER",
    timeline: "PROFESSIONAL",
    caseFacts: "PROFESSIONAL",
    arguments: "PROFESSIONAL",
    finalDecision: "PROFESSIONAL",
    riskAnalysis: "PROFESSIONAL",
    compliance: "PROFESSIONAL",
    multiLanguage: "PROFESSIONAL",
    comparison: "PROFESSIONAL",
    knowledgeBase: "ENTERPRISE",
    teamCollaboration: "ENTERPRISE",
    apiAccess: "ENTERPRISE",
    auditLogs: "ENTERPRISE",
    smartTags: "ENTERPRISE",
  };
  void PLAN_ORDER; // suppress unused var
  const required = FLAG_MINIMUM_PLAN[flagKey] ?? "PROFESSIONAL";
  const planNames: Record<string, string> = {
    FREE: "Free",
    STARTER: "Starter",
    PROFESSIONAL: "Professional",
    ENTERPRISE: "Enterprise",
  };

  return {
    allowed: false,
    reason: "FEATURE_GATED",
    message: `This feature is not available on the ${sub.plan.name} plan. Upgrade to ${planNames[required] ?? required} or higher to unlock it.`,
    planName: sub.plan.name,
    requiredPlan: required,
  };
}

export interface AiQuestionCheckResult {
  allowed: boolean;
  reason?: "NO_SUBSCRIPTION" | "INACTIVE" | "QUESTION_LIMIT";
  message?: string;
  planName?: string;
  limit?: number;
  used?: number;
}

/**
 * Check whether the user is within their monthly AI question quota.
 * Each call to `/api/ai/ask` should pass through this check.
 *
 * NOTE: AI questions are not individually persisted. We approximate usage by
 * counting all aiResult rows generated for the user's documents this month.
 * A proper QuestionLog table can replace this in a future migration.
 */
export async function checkAiQuestionAllowed(
  userId: string
): Promise<AiQuestionCheckResult> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [sub, questionCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId }, include: { plan: true } }),
    // Count all aiResult rows for this user's documents this month as usage proxy.
    prisma.aiResult.count({
      where: {
        document: { userId },
        createdAt: { gte: monthStart },
      },
    }),
  ]);

  if (!sub) {
    return { allowed: false, reason: "NO_SUBSCRIPTION", message: "No active subscription found." };
  }
  if (sub.status !== "ACTIVE") {
    return { allowed: false, reason: "INACTIVE", message: "Your subscription is not active.", planName: sub.plan.name };
  }

  const limits = sub.plan.limits as unknown as SubscriptionOverview["limits"];
  if (!limits) return { allowed: true };

  const questionLimit = limits.aiQuestions;
  if (questionLimit < 0) return { allowed: true }; // unlimited

  if (questionCount >= questionLimit) {
    return {
      allowed: false,
      reason: "QUESTION_LIMIT",
      message: `You've used all ${questionLimit} AI question${questionLimit === 1 ? "" : "s"} included in your ${sub.plan.name} plan this month. Upgrade to ask more questions.`,
      planName: sub.plan.name,
      limit: questionLimit,
      used: questionCount,
    };
  }

  return { allowed: true };
}

/**
 * Return parsed feature flags for a user's active plan. Returns all-false flags
 * if no active subscription exists (safe default — deny advanced features).
 */
export async function getEffectiveFlags(userId: string): Promise<PlanFeatureFlags> {
  const ALL_FALSE: PlanFeatureFlags = {
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

  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
  if (!sub || sub.status !== "ACTIVE") return ALL_FALSE;
  return { ...ALL_FALSE, ...((sub.plan.featureFlags ?? {}) as Partial<PlanFeatureFlags>) };
}
