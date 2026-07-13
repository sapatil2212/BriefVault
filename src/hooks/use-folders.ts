"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/lib/api/client";

export interface FolderItem {
  id: string;
  name: string;
  color: string | null;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export function useFolders() {
  return useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const res = await apiGet<FolderItem[]>("/api/folders");
      return res.data;
    },
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; color?: string | null }) => {
      await apiSend("/api/folders", "POST", input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }),
  });
}

export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; color?: string | null }) => {
      const { id, ...rest } = input;
      await apiSend(`/api/folders/${id}`, "PATCH", rest);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiSend(`/api/folders/${id}`, "DELETE");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }),
  });
}
