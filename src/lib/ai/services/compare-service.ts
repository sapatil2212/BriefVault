import "server-only";
import { prisma } from "@/lib/prisma";
import { compareTexts, type CompareResult } from "@/lib/ai/modules/compare";

export interface CompareResponse {
  documentA: { id: string; title: string };
  documentB: { id: string; title: string };
  result: CompareResult;
}

/**
 * Compare two owned documents by their cleaned text. Both must belong to the
 * caller and have extracted content.
 */
export async function compareDocuments(
  userId: string,
  aId: string,
  bId: string
): Promise<CompareResponse | { error: "NOT_FOUND" | "NO_TEXT" }> {
  const [a, b] = await Promise.all([
    prisma.document.findFirst({
      where: { id: aId, userId, deletedAt: null },
      select: { id: true, title: true, cleanedText: true, rawText: true },
    }),
    prisma.document.findFirst({
      where: { id: bId, userId, deletedAt: null },
      select: { id: true, title: true, cleanedText: true, rawText: true },
    }),
  ]);

  if (!a || !b) return { error: "NOT_FOUND" };

  const textA = a.cleanedText ?? a.rawText ?? "";
  const textB = b.cleanedText ?? b.rawText ?? "";
  if (!textA.trim() || !textB.trim()) return { error: "NO_TEXT" };

  return {
    documentA: { id: a.id, title: a.title },
    documentB: { id: b.id, title: b.title },
    result: compareTexts(textA, textB),
  };
}
