"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend, ApiError } from "@/lib/api/client";

export interface DocumentListItem {
  id: string;
  title: string;
  kind: string;
  status: string;
  sizeBytes: number | null;
  pageCount: number | null;
  resultCount: number;
  court: string | null;
  caseNumber: string | null;
  createdAt: string;
}

/**
 * List the current user's documents. While any document is still processing
 * (or freshly uploaded), poll every few seconds so the UI reflects the
 * background worker's progress without a manual refresh.
 */
export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await apiGet<DocumentListItem[]>("/api/documents?take=100");
      return res.data;
    },
    refetchInterval: (query) => {
      const items = query.state.data as DocumentListItem[] | undefined;
      if (!items) return false;
      const now = Date.now();
      const active = items.some((d) => {
        if (d.status === "PROCESSING") return true;
        // Cover the brief UPLOADED→PROCESSING window; self-limit afterwards so
        // unsupported files (which stay UPLOADED) don't poll forever.
        if (d.status === "UPLOADED") {
          return now - new Date(d.createdAt).getTime() < 3 * 60_000;
        }
        return false;
      });
      return active ? 4_000 : false;
    },
  });
}

/** Upload a file (multipart, processed asynchronously) and refresh the list. */
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      // Async: the durable queue worker processes in the background so the
      // upload returns immediately and survives restarts.
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new ApiError(json?.message ?? "Upload failed.", res.status, json?.code);
      }
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}

/** Soft-delete a document and refresh the list. */
export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiSend(`/api/documents/${id}`, "DELETE");
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}
