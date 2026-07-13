/**
 * Client-safe catalog of AI analysis kinds (no server-only imports).
 * Drives the AI Workspace UI; the server registry provides the prompts/schemas.
 */
export type AnalysisRender = "sections" | "list" | "risk" | "checklist";
export type AnalysisGroup = "summary" | "litigation" | "compliance" | "references";

export interface AnalysisCatalogItem {
  kind: string;
  label: string;
  description: string;
  group: AnalysisGroup;
  render: AnalysisRender;
}

export const analysisCatalog: AnalysisCatalogItem[] = [
  { kind: "EXECUTIVE_SUMMARY", label: "Executive Summary", description: "High-level overview & outcome.", group: "summary", render: "sections" },
  { kind: "ONE_PAGE_SUMMARY", label: "One-Page Summary", description: "Structured single-page summary.", group: "summary", render: "sections" },
  { kind: "QUICK_SUMMARY", label: "Quick Summary", description: "30-second overview.", group: "summary", render: "sections" },
  { kind: "KEY_HIGHLIGHTS", label: "Key Highlights", description: "Important points, categorized.", group: "summary", render: "list" },
  { kind: "TIMELINE", label: "Timeline", description: "Chronological events.", group: "summary", render: "list" },
  { kind: "CASE_FACTS", label: "Case Facts", description: "Background, facts, evidence.", group: "litigation", render: "sections" },
  { kind: "QUESTIONS_BEFORE_COURT", label: "Questions Before Court", description: "Legal questions considered.", group: "litigation", render: "list" },
  { kind: "ARGUMENTS", label: "Arguments", description: "Positions by party.", group: "litigation", render: "sections" },
  { kind: "FINAL_DECISION", label: "Final Decision", description: "Outcome and relief.", group: "litigation", render: "sections" },
  { kind: "RATIO_DECIDENDI", label: "Ratio Decidendi", description: "Binding legal principle.", group: "litigation", render: "sections" },
  { kind: "OBITER_DICTA", label: "Obiter Dicta", description: "Persuasive observations.", group: "litigation", render: "list" },
  { kind: "SECTIONS_OF_LAW", label: "Sections of Law", description: "Articles, acts, sections, rules.", group: "references", render: "list" },
  { kind: "CASE_CITATIONS", label: "Case Citations", description: "Cited judgments & precedents.", group: "references", render: "list" },
  { kind: "IMPORTANT_PARAGRAPHS", label: "Important Paragraphs", description: "Most significant passages.", group: "references", render: "list" },
  { kind: "RISK_ANALYSIS", label: "Risk Analysis", description: "Compliance, tax, financial, litigation risk.", group: "compliance", render: "risk" },
  { kind: "COMPLIANCE_CHECKLIST", label: "Compliance Checklist", description: "Actionable obligations.", group: "compliance", render: "checklist" },
  { kind: "ACTION_ITEMS", label: "Action Items", description: "Practical next steps.", group: "compliance", render: "list" },
  { kind: "DEADLINES", label: "Deadlines & Dates", description: "Statutory deadlines & key dates.", group: "compliance", render: "list" },
  { kind: "MONETARY_INFO", label: "Monetary Information", description: "Tax, penalty, refund, etc.", group: "compliance", render: "list" },
];

export const groupLabels: Record<AnalysisGroup, string> = {
  summary: "Summaries",
  litigation: "Litigation Analysis",
  compliance: "Compliance & Risk",
  references: "Legal References",
};
