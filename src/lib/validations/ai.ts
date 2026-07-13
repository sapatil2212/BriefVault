import { z } from "zod";

/** Validation for the RAG Ask AI endpoint. */
export const askSchema = z.object({
  question: z.string().min(2, "Please enter a question.").max(2000),
  /** Optional: scope the answer to a single document. Omit for all documents. */
  documentId: z.string().min(1).optional(),
});

export type AskInput = z.infer<typeof askSchema>;

/** Validation for the conversational assistant widget (general chat). */
export const assistantSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1, "Send at least one message.")
    .max(40),
});

export type AssistantInput = z.infer<typeof assistantSchema>;

/** Analysis kinds available through the generic analyze endpoint. */
export const analysisKinds = [
  "EXECUTIVE_SUMMARY",
  "ONE_PAGE_SUMMARY",
  "QUICK_SUMMARY",
  "KEY_HIGHLIGHTS",
  "TIMELINE",
  "CASE_FACTS",
  "QUESTIONS_BEFORE_COURT",
  "ARGUMENTS",
  "FINAL_DECISION",
  "RATIO_DECIDENDI",
  "OBITER_DICTA",
  "SECTIONS_OF_LAW",
  "CASE_CITATIONS",
  "IMPORTANT_PARAGRAPHS",
  "RISK_ANALYSIS",
  "COMPLIANCE_CHECKLIST",
  "ACTION_ITEMS",
  "DEADLINES",
  "MONETARY_INFO",
] as const;

/** Validation for the generic analysis endpoint. */
export const analyzeSchema = z.object({
  documentId: z.string().min(1),
  kind: z.enum(analysisKinds),
  force: z.boolean().optional(),
});

export type AnalyzeInput = z.infer<typeof analyzeSchema>;

/** Validation for document comparison. */
export const compareSchema = z
  .object({
    documentAId: z.string().min(1),
    documentBId: z.string().min(1),
  })
  .refine((v) => v.documentAId !== v.documentBId, {
    message: "Select two different documents.",
  });

export type CompareInput = z.infer<typeof compareSchema>;

/** Validation for report generation. */
export const reportSchema = z.object({
  documentId: z.string().min(1),
  type: z.enum(["EXECUTIVE", "CLIENT", "COMPLIANCE", "LEGAL_OPINION"]),
});

export type ReportInput = z.infer<typeof reportSchema>;
