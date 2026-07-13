import { z } from "zod";

/**
 * Zod schemas for document + AI endpoints. Every route validates input here;
 * client data is never trusted directly.
 */

export const processDocumentSchema = z.object({
  title: z.string().min(1, "Title is required.").max(300),
  /** Phase 1 accepts raw text directly (paste or .txt upload). */
  text: z.string().min(1, "Document text is required.").max(2_000_000),
  mimeType: z.string().max(150).optional(),
  fileName: z.string().max(300).optional(),
  /** Optional folder to organize the document. */
  folderId: z.string().min(1).nullable().optional(),
  /** Process synchronously and return results in the response. */
  sync: z.boolean().optional(),
});

export type ProcessDocumentInput = z.infer<typeof processDocumentSchema>;

export const summarizeSchema = z.object({
  documentId: z.string().min(1),
  /** Force regeneration even if a cached summary exists. */
  force: z.boolean().optional(),
});

export type SummarizeInput = z.infer<typeof summarizeSchema>;

/** PATCH /api/documents/:id — rename and/or move between folders. */
export const updateDocumentSchema = z
  .object({
    title: z.string().min(1, "Title is required.").max(300).optional(),
    folderId: z.string().min(1).nullable().optional(),
  })
  .refine((v) => v.title !== undefined || v.folderId !== undefined, {
    message: "Nothing to update.",
  });

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
