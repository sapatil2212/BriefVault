"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/lib/api/client";

export interface TrashedDocument {
  id: string;
  title: string;
  kind: string;
  status: string;
  sizeBytes: number | null;
  resultCount: number;
  deletedAt: string;
  createdAt: string;
}

/** List the user's soft-deleted documents. */
export function useTrash() {
  return useQuery({
    queryKey: ["documents", "trash"],
    queryFn: async () => {
      const res = await apiGet<TrashedDocument[]>("/api/documents/trash");
      return res.data;
    },
  });
}

export function useRestoreDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiSend(`/api/documents/${id}/restore`, "POST");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", "trash"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

export function usePermanentlyDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiSend(`/api/documents/${id}?permanent=true`, "DELETE");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", "trash"] });
    },
  });
}
