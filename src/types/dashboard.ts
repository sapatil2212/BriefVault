/** Client/server shared shapes for dashboard data. */

export type DocumentKindValue =
  | "PDF"
  | "DOCX"
  | "TXT"
  | "SCANNED_PDF"
  | "IMAGE"
  | "UNKNOWN";

export interface DashboardStatsDTO {
  totalDocuments: number;
  processed: number;
  pending: number;
  failed: number;
  summariesGenerated: number;
  insightsExtracted: number;
  storageBytes: number;
  readingTimeSavedMinutes: number;
  categories: { label: string; kind: DocumentKindValue; count: number }[];
  recentDocuments: {
    id: string;
    title: string;
    kind: DocumentKindValue;
    status: string;
    createdAt: string;
    resultCount: number;
  }[];
  trend: {
    labels: string[];
    uploaded: number[];
    summarized: number[];
  };
  insights: {
    relatedJudgments: number;
    relevantSections: number;
    documentsAnalyzed: number;
  };
}
