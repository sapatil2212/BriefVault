"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/lib/api/client";

export interface NotificationItem {
  id: string;
  type: "DOCUMENT_READY" | "DOCUMENT_FAILED" | "SYSTEM" | "INFO";
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

/** Poll the user's notifications + unread count. */
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiGet<NotificationItem[]>("/api/notifications");
      return { items: res.data, unread: (res.meta?.unread as number) ?? 0 };
    },
    refetchInterval: 30_000,
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiSend("/api/notifications", "POST");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiSend(`/api/notifications/${id}`, "POST");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
