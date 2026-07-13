"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/lib/api/client";
import type {
  OverviewResponse,
  AdminUserRow,
  AdminOrganizationRow,
  AiUsageResponse,
  AdminDocumentRow,
  QueueSummaryRow,
  QueueJobRow,
  HealthCheck,
  AiProviderInfo,
} from "@/types/admin";

/**
 * Client hooks for the Super Admin console. Every hook wraps a real
 * `/api/admin/*` endpoint through the envelope-aware fetch client and follows
 * the app's TanStack Query conventions (array query keys, invalidate on
 * mutate). Pagination metadata rides on the envelope `meta`.
 */

type Meta = { total: number; page: number; pageSize: number; pageCount: number; [k: string]: unknown };

function qs(params: Record<string, unknown> | object): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* ── Overview ─────────────────────────────────────────────────────────── */
export function useAdminOverview(days = 30) {
  return useQuery({
    queryKey: ["admin", "overview", days],
    queryFn: async () => (await apiGet<OverviewResponse>(`/api/admin/overview${qs({ days })}`)).data,
    refetchInterval: 60_000,
  });
}

/* ── Users ────────────────────────────────────────────────────────────── */
export interface UserQuery {
  search?: string;
  role?: string;
  status?: string;
  organization?: string;
  orgType?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminUsers(params: UserQuery) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const res = await apiGet<AdminUserRow[]>(`/api/admin/users${qs(params)}`);
      return { items: res.data, meta: res.meta as Meta };
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminUserDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin", "user", id],
    enabled: Boolean(id),
    queryFn: async () =>
      (await apiGet<import("@/types/admin").AdminUserDetail>(`/api/admin/users/${id}`)).data,
  });
}

export type UserAction =
  | { action: "setStatus"; status: "ACTIVE" | "SUSPENDED" }
  | { action: "forceLogout" }
  | { action: "resetPassword"; password: string }
  | {
      action: "updateProfile";
      firstName: string;
      lastName: string;
      phone: string;
      organization: string;
      orgType: string;
      status?: "ACTIVE" | "SUSPENDED";
    };

export function useUserAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & UserAction) =>
      (await apiSend(`/api/admin/users/${id}`, "PATCH", body)).data,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "user", vars.id] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiSend(`/api/admin/users/${id}`, "DELETE")).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

/* ── Pending users / approval workflow ────────────────────────────────── */
export interface PendingQuery {
  search?: string;
  plan?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminPendingUsers(params: PendingQuery) {
  return useQuery({
    queryKey: ["admin", "pending-users", params],
    queryFn: async () => {
      const res = await apiGet<import("@/types/admin").PendingUserRow[]>(`/api/admin/pending-users${qs(params)}`);
      return { items: res.data, meta: res.meta as Meta };
    },
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useAdminPendingUserDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin", "pending-user", id],
    enabled: Boolean(id),
    queryFn: async () =>
      (await apiGet<import("@/types/admin").PendingUserDetail>(`/api/admin/pending-users/${id}`)).data,
  });
}

export type PendingUserAction =
  | { action: "approve"; plan?: string }
  | { action: "reject"; reason: string }
  | { action: "requestInfo"; message: string }
  | { action: "suspend" }
  | { action: "reactivate" }
  | { action: "changePlan"; plan: string };

export function usePendingUserAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & PendingUserAction) =>
      (await apiSend(`/api/admin/pending-users/${id}`, "PATCH", body)).data,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "pending-users"] });
      qc.invalidateQueries({ queryKey: ["admin", "pending-user", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
  });
}

/* ── Subscriptions ────────────────────────────────────────────────────── */
export interface SubscriptionQuery {
  search?: string;
  status?: string;
  plan?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminSubscriptions(params: SubscriptionQuery) {
  return useQuery({
    queryKey: ["admin", "subscriptions", params],
    queryFn: async () => {
      const res = await apiGet<import("@/types/admin").AdminSubscriptionRow[]>(
        `/api/admin/subscriptions${qs(params)}`
      );
      return {
        items: res.data,
        meta: res.meta as Meta & { stats: import("@/types/admin").SubscriptionStats },
      };
    },
    placeholderData: keepPreviousData,
  });
}

/* ── Plans ────────────────────────────────────────────────────────────── */
export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await apiGet<import("@/lib/plans/types").PublicPlan[]>(`/api/plans`)).data,
    staleTime: 5 * 60_000,
  });
}

/* ── Organizations ────────────────────────────────────────────────────── */
export function useAdminOrganizations(params: { search?: string; orgType?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "orgs", params],
    queryFn: async () => {
      const res = await apiGet<AdminOrganizationRow[]>(`/api/admin/organizations${qs(params)}`);
      return { items: res.data, meta: res.meta as Meta };
    },
    placeholderData: keepPreviousData,
  });
}

/* ── AI Usage ─────────────────────────────────────────────────────────── */
export function useAdminAiUsage(params: { days?: number; provider?: string; module?: string }) {
  return useQuery({
    queryKey: ["admin", "ai-usage", params],
    queryFn: async () => (await apiGet<AiUsageResponse>(`/api/admin/ai-usage${qs(params)}`)).data,
    // Live view: keep KPIs/charts current as new AI requests are logged.
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}

/* ── AI Providers ─────────────────────────────────────────────────────── */
export function useAdminProviders() {
  return useQuery({
    queryKey: ["admin", "providers"],
    queryFn: async () =>
      (
        await apiGet<{ providers: AiProviderInfo[]; health: unknown[] }>(`/api/admin/providers`)
      ).data,
  });
}

/* ── Documents ────────────────────────────────────────────────────────── */
export function useAdminDocuments(params: {
  search?: string;
  status?: string;
  kind?: string;
  organization?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ["admin", "documents", params],
    queryFn: async () => {
      const res = await apiGet<AdminDocumentRow[]>(`/api/admin/documents${qs(params)}`);
      return { items: res.data, meta: res.meta as Meta & { counts: Record<string, number> } };
    },
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });
}

export function useRetryDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiSend(`/api/admin/documents/${id}`, "PATCH", { action: "retry" })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "documents"] }),
  });
}

/* ── Queues ───────────────────────────────────────────────────────────── */
export function useAdminQueues(params: { type?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "queues", params],
    queryFn: async () => {
      const res = await apiGet<{ summary: QueueSummaryRow[]; jobs: QueueJobRow[] }>(
        `/api/admin/queues${qs(params)}`
      );
      return { ...res.data, meta: res.meta as Meta };
    },
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
  });
}

export function useQueueAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      body:
        | { action: "retry"; jobId: string }
        | { action: "cancel"; jobId: string }
        | { action: "retryAllFailed"; type?: string }
    ) => (await apiSend(`/api/admin/queues`, "POST", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "queues"] }),
  });
}

/* ── Demo Enquiries ───────────────────────────────────────────────────── */
export interface DemoEnquiryQuery {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface DemoEnquiryRow {
  id: string;
  name: string;
  email: string;
  company: string;
  businessType: string;
  phone: string;
  whatsapp: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  message: string | null;
  status: "NEW" | "CONTACTED" | "SCHEDULED" | "CLOSED";
  notes: string | null;
  createdAt: string;
}

export function useAdminDemoEnquiries(params: DemoEnquiryQuery) {
  return useQuery({
    queryKey: ["admin", "demo-enquiries", params],
    queryFn: async () => {
      const res = await apiGet<DemoEnquiryRow[]>(`/api/admin/demo-enquiries${qs(params)}`);
      return { items: res.data, meta: res.meta as Meta & { counts: Record<string, number> } };
    },
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
}

export function useAdminDemoEnquiryDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin", "demo-enquiry", id],
    enabled: Boolean(id),
    queryFn: async () => (await apiGet<DemoEnquiryRow>(`/api/admin/demo-enquiries/${id}`)).data,
  });
}

export function useUpdateDemoEnquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: { id: string; status?: DemoEnquiryRow["status"]; notes?: string }) =>
      (await apiSend(`/api/admin/demo-enquiries/${id}`, "PATCH", body)).data,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "demo-enquiries"] });
      qc.invalidateQueries({ queryKey: ["admin", "demo-enquiry", vars.id] });
    },
  });
}

export function useDeleteDemoEnquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiSend(`/api/admin/demo-enquiries/${id}`, "DELETE")).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "demo-enquiries"] }),
  });
}

/* ── Health ───────────────────────────────────────────────────────────── */
export function useAdminHealth() {
  return useQuery({
    queryKey: ["admin", "health"],
    queryFn: async () => (await apiGet<HealthCheck[]>(`/api/admin/health`)).data,
    refetchInterval: 30_000,
  });
}

