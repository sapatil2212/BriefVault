import "server-only";
import { prisma } from "@/lib/prisma";
import type { AiResultKind, DocumentKind } from "@prisma/client";

/**
 * Aggregated dashboard statistics computed live from the database.
 * No mock data — every number reflects the caller's actual documents.
 */
export interface DashboardStats {
  totalDocuments: number;
  processed: number;
  pending: number;
  failed: number;
  summariesGenerated: number;
  insightsExtracted: number;
  storageBytes: number;
  readingTimeSavedMinutes: number;
  categories: { label: string; kind: DocumentKind; count: number }[];
  recentDocuments: {
    id: string;
    title: string;
    kind: DocumentKind;
    status: string;
    createdAt: Date;
    resultCount: number;
  }[];
  /** Weekly upload vs. summary counts for the trend chart (oldest → newest). */
  trend: {
    labels: string[];
    uploaded: number[];
    summarized: number[];
  };
  /** Cross-document intelligence surfaced in the AI Insights panel. */
  insights: {
    relatedJudgments: number;
    relevantSections: number;
    documentsAnalyzed: number;
  };
}

/** AI result kinds that count as a "summary" vs. a generic "insight". */
const SUMMARY_KINDS: AiResultKind[] = [
  "EXECUTIVE_SUMMARY",
  "ONE_PAGE_SUMMARY",
  "QUICK_SUMMARY",
];

/** Bucket a set of dates into `weeks` trailing weekly buckets. */
function weeklyBuckets(dates: Date[], weeks: number, now = Date.now()) {
  const msWeek = 7 * 24 * 60 * 60 * 1000;
  const counts = new Array<number>(weeks).fill(0);
  const start = now - weeks * msWeek;
  for (const d of dates) {
    const t = d.getTime();
    if (t < start) continue;
    const idx = Math.min(weeks - 1, Math.floor((t - start) / msWeek));
    counts[idx] += 1;
  }
  const labels = Array.from({ length: weeks }, (_, i) => {
    const label = new Date(start + i * msWeek);
    return label.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  });
  return { labels, counts };
}

const KIND_LABELS: Record<DocumentKind, string> = {
  PDF: "PDF",
  DOCX: "Word",
  TXT: "Text",
  SCANNED_PDF: "Scanned PDF",
  IMAGE: "Image",
  UNKNOWN: "Other",
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const where = { userId, deletedAt: null } as const;
  const TREND_WEEKS = 6;
  const trendSince = new Date(Date.now() - TREND_WEEKS * 7 * 24 * 60 * 60 * 1000);

  const [
    totalDocuments,
    processed,
    pending,
    failed,
    summariesGenerated,
    insightsExtracted,
    sizeAgg,
    byKind,
    summaries,
    recent,
    relatedJudgments,
    relevantSections,
    documentsAnalyzed,
    trendDocDates,
    trendSummaryRows,
  ] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.count({ where: { ...where, status: "READY" } }),
    prisma.document.count({ where: { ...where, status: { in: ["UPLOADED", "PROCESSING"] } } }),
    prisma.document.count({ where: { ...where, status: "FAILED" } }),
    prisma.aiResult.count({
      where: { kind: { in: SUMMARY_KINDS }, document: where },
    }),
    prisma.aiResult.count({ where: { document: where } }),
    prisma.document.aggregate({ where, _sum: { sizeBytes: true } }),
    prisma.document.groupBy({ by: ["kind"], where, _count: { _all: true } }),
    prisma.aiResult.findMany({
      where: { kind: "EXECUTIVE_SUMMARY", document: where },
      select: { payload: true },
    }),
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { results: true } } },
    }),
    prisma.aiResult.count({ where: { kind: "CASE_CITATIONS", document: where } }),
    prisma.aiResult.count({ where: { kind: "SECTIONS_OF_LAW", document: where } }),
    prisma.document.count({ where: { ...where, status: "READY" } }),
    prisma.document.findMany({
      where: { ...where, createdAt: { gte: trendSince } },
      select: { createdAt: true },
    }),
    prisma.aiResult.findMany({
      where: {
        kind: { in: SUMMARY_KINDS },
        document: where,
        createdAt: { gte: trendSince },
      },
      select: { createdAt: true },
    }),
  ]);

  // Sum reading-time-saved across executive summaries (payload is JSON).
  const readingTimeSavedMinutes = summaries.reduce((sum, r) => {
    const payload = r.payload as { readingTimeSavedMinutes?: number } | null;
    return sum + (payload?.readingTimeSavedMinutes ?? 0);
  }, 0);

  const uploadedBuckets = weeklyBuckets(
    trendDocDates.map((d) => d.createdAt),
    TREND_WEEKS
  );
  const summarizedBuckets = weeklyBuckets(
    trendSummaryRows.map((r) => r.createdAt),
    TREND_WEEKS
  );

  return {
    totalDocuments,
    processed,
    pending,
    failed,
    summariesGenerated,
    insightsExtracted,
    storageBytes: sizeAgg._sum.sizeBytes ?? 0,
    readingTimeSavedMinutes,
    categories: byKind
      .map((g) => ({
        label: KIND_LABELS[g.kind],
        kind: g.kind,
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count),
    recentDocuments: recent.map((d) => ({
      id: d.id,
      title: d.title,
      kind: d.kind,
      status: d.status,
      createdAt: d.createdAt,
      resultCount: d._count.results,
    })),
    trend: {
      labels: uploadedBuckets.labels,
      uploaded: uploadedBuckets.counts,
      summarized: summarizedBuckets.counts,
    },
    insights: {
      relatedJudgments,
      relevantSections,
      documentsAnalyzed,
    },
  };
}
