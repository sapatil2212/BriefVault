import type { UserRole, UserStatus } from "@/types/user";

/**
 * Shared DTOs for the Super Admin console. These describe the JSON shape
 * returned by `/api/admin/*` route handlers and consumed by the admin hooks,
 * keeping server and client in sync from one place.
 */

export interface TrendPoint {
  /** ISO date (day granularity). */
  date: string;
  value: number;
}

export interface MultiTrendPoint {
  date: string;
  [series: string]: number | string;
}

/** Platform-wide KPI snapshot for the overview dashboard. */
export interface OverviewKpis {
  totalOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  documentsUploaded: number;
  documentsProcessed: number;
  documentsFailed: number;
  aiRequests: number;
  aiRequestsFailed: number;
  aiQueueDepth: number;
  processingQueueDepth: number;
  storageBytes: number;
  tokensConsumed: number;
  estimatedCostUsd: number;
  activeSubscriptions: number;
  monthlyGrowthPct: number;
  newUsers30d: number;
}

export interface OverviewResponse {
  kpis: OverviewKpis;
  charts: {
    userGrowth: TrendPoint[];
    orgGrowth: TrendPoint[];
    documentUploads: TrendPoint[];
    aiUsage: TrendPoint[];
    tokenConsumption: TrendPoint[];
    storageGrowth: TrendPoint[];
    avgProcessingMs: TrendPoint[];
    apiRequests: TrendPoint[];
  };
  health: HealthCheck[];
  generatedAt: string;
}

export type HealthState = "operational" | "degraded" | "down" | "unknown";

export interface HealthCheck {
  key: string;
  label: string;
  state: HealthState;
  latencyMs: number | null;
  detail?: string;
  uptimePct?: number | null;
}

export interface AdminUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  orgType: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  documentCount: number;
  sessionCount: number;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Full detail for the admin "view/edit user" dialog, incl. recent sessions. */
export interface AdminUserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  orgType: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  verifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  sessions: {
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    expiresAt: string;
  }[];
  counts: { documents: number; folders: number; notifications: number };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/* ── Pending users / approval workflow ────────────────────────────────── */

/** Row in the Super Admin "Pending Users" list. */
export interface PendingUserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  country: string | null;
  planKey: string | null;
  planName: string;
  emailVerified: boolean;
  status: import("@/types/user").UserStatus;
  createdAt: string;
}

export interface ApprovalHistoryItem {
  id: string;
  decision: "PENDING" | "APPROVED" | "REJECTED" | "INFO_REQUESTED";
  remarks: string | null;
  approvedBy: string | null;
  createdAt: string;
}

/* ── Subscriptions ────────────────────────────────────────────────────── */

export interface AdminSubscriptionRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  organization: string;
  planKey: string;
  planName: string;
  priceMonthly: number;
  currency: string;
  status: import("@/types/user").SubscriptionStatus;
  startedAt: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  pending: number;
  cancelled: number;
  expired: number;
  /** Monthly recurring revenue from active subscriptions (major currency units). */
  mrr: number;
  perPlan: { key: string; name: string; active: number }[];
}

/** Full detail for the pending-user review panel. */
export interface PendingUserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  orgType: string;
  designation: string | null;
  country: string | null;
  status: import("@/types/user").UserStatus;
  emailVerified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  signup: {
    ip: string | null;
    device: string;
    browser: string;
    userAgent: string | null;
  };
  subscription: {
    status: import("@/types/user").SubscriptionStatus;
    planKey: string;
    planName: string;
    priceMonthly: number;
    currency: string;
    currentPeriodEnd: string | null;
  } | null;
  approvals: ApprovalHistoryItem[];
}

export interface AdminOrganizationRow {
  /** Slug derived from the organization name (no org table yet). */
  id: string;
  name: string;
  orgType: string;
  userCount: number;
  activeUserCount: number;
  documentCount: number;
  storageBytes: number;
  aiRequests: number;
  createdAt: string;
  status: "ACTIVE" | "SUSPENDED";
}

export interface AiUsageSummary {
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  successRate: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
}

export interface AiUsageResponse {
  summary: AiUsageSummary;
  byProvider: Array<{
    provider: string;
    requests: number;
    tokens: number;
    costUsd: number;
    avgLatencyMs: number;
    failed: number;
  }>;
  byModule: Array<{ module: string; requests: number; tokens: number }>;
  trend: TrendPoint[];
}

export interface AdminDocumentRow {
  id: string;
  title: string;
  kind: string;
  status: string;
  ownerEmail: string;
  ownerName: string;
  organization: string;
  sizeBytes: number | null;
  pageCount: number | null;
  createdAt: string;
}

export interface QueueSummaryRow {
  type: string;
  pending: number;
  running: number;
  succeeded: number;
  failed: number;
  total: number;
}

export interface QueueJobRow {
  id: string;
  type: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  runAt: string;
  lastError: string | null;
  createdAt: string;
}

export interface AiProviderInfo {
  key: string;
  label: string;
  configured: boolean;
  isActive: boolean;
  isDefault: boolean;
  model?: string;
  baseUrl?: string;
}
