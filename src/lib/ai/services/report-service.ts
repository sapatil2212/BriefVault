import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma, type ReportType } from "@prisma/client";
import { composeReport, type ReportInputs } from "@/lib/ai/modules/report";
import { getOrCreateExecutiveSummary } from "@/lib/ai/services/summary-service";

interface ExecPayload {
  overview: string | null;
  purpose: string | null;
  background: string | null;
  decision: string | null;
  outcome: string | null;
}

/**
 * Generate and persist a report for an owned document. Ensures an executive
 * summary exists first (generating it if needed), then composes the requested
 * report type from that grounded output + extracted metadata.
 */
export async function createReport(
  userId: string,
  documentId: string,
  type: ReportType
) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId, deletedAt: null },
    include: { metadata: true },
  });
  if (!doc) return null;

  // Guarantee we have an executive summary to base the report on.
  const { result: summaryResult } = await getOrCreateExecutiveSummary(documentId, false);
  const payload = summaryResult.payload as unknown as ExecPayload;

  const input: ReportInputs = {
    documentTitle: doc.title,
    summary: {
      overview: payload.overview ?? null,
      purpose: payload.purpose ?? null,
      background: payload.background ?? null,
      decision: payload.decision ?? null,
      outcome: payload.outcome ?? null,
    },
    metadata: doc.metadata
      ? {
          court: doc.metadata.court,
          caseNumber: doc.metadata.caseNumber,
          judge: doc.metadata.judge,
          decisionDate: doc.metadata.decisionDate,
          acts: (doc.metadata.acts as string[] | null) ?? [],
          sections: (doc.metadata.sections as string[] | null) ?? [],
        }
      : null,
    provider: summaryResult.provider ?? "extractive",
    model: summaryResult.model ?? "extractive-v1",
  };

  const report = composeReport(type, input);

  return prisma.report.create({
    data: {
      userId,
      documentId,
      type,
      title: report.title,
      sections: report.sections as unknown as Prisma.InputJsonValue,
      markdown: report.markdown,
      provider: report.provider,
      model: report.model,
    },
  });
}

export async function listReports(userId: string) {
  const rows = await prisma.report.findMany({
    where: { userId, document: { deletedAt: null } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { document: { select: { title: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    documentId: r.documentId,
    documentTitle: r.document.title,
    provider: r.provider,
    createdAt: r.createdAt,
  }));
}

export async function getReport(userId: string, id: string) {
  return prisma.report.findFirst({
    where: { id, userId },
  });
}

export async function deleteReport(userId: string, id: string) {
  const existing = await prisma.report.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.report.delete({ where: { id } });
  return true;
}
