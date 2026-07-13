"use client";

import { useMutation } from "@tanstack/react-query";
import { apiSend } from "@/lib/api/client";

export type DiffType = "equal" | "added" | "removed" | "modified";

export interface DiffSegment {
  type: DiffType;
  before: string | null;
  after: string | null;
  similarity?: number;
}

export interface CompareData {
  documentA: { id: string; title: string };
  documentB: { id: string; title: string };
  result: {
    segments: DiffSegment[];
    stats: { added: number; removed: number; modified: number; unchanged: number };
    similarity: number;
  };
}

export function useCompare() {
  return useMutation({
    mutationFn: async (input: { documentAId: string; documentBId: string }) => {
      const res = await apiSend<CompareData>("/api/ai/compare", "POST", input);
      return res.data;
    },
  });
}
