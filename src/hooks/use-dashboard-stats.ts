"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { DashboardStatsDTO } from "@/types/dashboard";

/** Fetch live dashboard statistics for the current user. */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await apiGet<DashboardStatsDTO>("/api/dashboard/stats");
      return res.data;
    },
  });
}
