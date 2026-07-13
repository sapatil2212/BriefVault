"use client";

import { useMutation } from "@tanstack/react-query";
import { apiSend } from "@/lib/api/client";

export interface AnalysisResult {
  kind: string;
  payload: unknown;
  citations: unknown;
  confidence: number;
  provider: string | null;
}

/** Generate (or fetch cached) analysis for a document + kind. */
export function useAnalyze() {
  return useMutation({
    mutationFn: async (input: { documentId: string; kind: string; force?: boolean }) => {
      const res = await apiSend<AnalysisResult>("/api/ai/analyze", "POST", input);
      return res.data;
    },
  });
}
