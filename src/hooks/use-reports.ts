"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/lib/api/client";

export type ReportType = "EXECUTIVE" | "CLIENT" | "COMPLIANCE" | "LEGAL_OPINION";

export interface ReportListItem {
  id: string;
  title: string;
  type: ReportType;
  documentId: string;
  documentTitle: string;
  provider: string | null;
  createdAt: string;
}

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await apiGet<ReportListItem[]>("/api/reports");
      return res.data;
    },
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { documentId: string; type: ReportType }) => {
      const res = await apiSend<{ id: string; title: string; type: ReportType }>(
        "/api/ai/report",
        "POST",
        input
      );
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiSend(`/api/reports/${id}`, "DELETE");
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}
