import { z } from "zod";

/** Zod schemas for folder endpoints. */

export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required.").max(120),
  color: z.string().max(20).nullable().optional(),
});

export const updateFolderSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    color: z.string().max(20).nullable().optional(),
  })
  .refine((v) => v.name !== undefined || v.color !== undefined, {
    message: "Nothing to update.",
  });

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
