import { z } from "zod";
import type { AiResultKind } from "@prisma/client";
import type { RetrievedChunk } from "@/lib/ai/types";

/**
 * The four render shapes every analysis payload conforms to, so the UI can
 * render any analysis kind generically without bespoke components.
 */
export type AnalysisRender = "sections" | "list" | "risk" | "checklist";

/**
 * Per-item grounding. `ref` is the supporting chunk id the model cites
 * (`[#id]` in the context); `page`/`paragraph` are resolved from it server-side.
 */
const citationFields = {
  ref: z.string().nullable().optional(),
  page: z.number().nullable().optional(),
  paragraph: z.number().nullable().optional(),
};

/** { sections: [{ heading, body, ref? }] } — narrative analyses. */
export const sectionsSchema = z.object({
  sections: z.array(
    z.object({
      heading: z.string(),
      body: z.string().nullable().optional(),
      ...citationFields,
    })
  ),
});

/** { items: [{ title, detail?, tag?, ref? }] } — enumerations. */
export const listSchema = z.object({
  items: z.array(
    z.object({
      title: z.string(),
      detail: z.string().nullable().optional(),
      tag: z.string().nullable().optional(),
      ...citationFields,
    })
  ),
});

/** { risks: [{ category, level, reasoning }] } — risk analysis. */
export const riskSchema = z.object({
  risks: z.array(
    z.object({
      category: z.string(),
      level: z.enum(["Low", "Medium", "High"]),
      reasoning: z.string(),
    })
  ),
});

/** { items: [{ label, done }] } — actionable checklists. */
export const checklistSchema = z.object({
  items: z.array(
    z.object({
      label: z.string(),
      done: z.boolean(),
    })
  ),
});

export type SectionsPayload = z.infer<typeof sectionsSchema>;
export type ListPayload = z.infer<typeof listSchema>;
export type RiskPayload = z.infer<typeof riskSchema>;
export type ChecklistPayload = z.infer<typeof checklistSchema>;
export type AnalysisPayload =
  | SectionsPayload
  | ListPayload
  | RiskPayload
  | ChecklistPayload;

/** Definition of a single AI analysis module. */
export interface AnalysisDef {
  kind: AiResultKind;
  label: string;
  description: string;
  group: "summary" | "litigation" | "compliance" | "references";
  render: AnalysisRender;
  /** System prompt for the LLM path. */
  system: string;
  /** Build the user prompt from the document title + retrieved context. */
  buildUser: (title: string, chunks: RetrievedChunk[]) => string;
  /** Zod schema the LLM JSON output must satisfy. */
  schema: z.ZodType<AnalysisPayload>;
  /** Deterministic, grounded fallback when no LLM is configured. */
  fallback: (title: string, fullText: string, chunks: RetrievedChunk[]) => AnalysisPayload;
}
