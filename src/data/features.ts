import {
  FileText,
  Scale,
  MessageSquareText,
  GitCompareArrows,
  ShieldCheck,
  AlertTriangle,
  CalendarClock,
  FileBarChart,
  ScanText,
  Search,
  Lock,
  Languages,
  ListChecks,
  Gavel,
  BookOpenText,
} from "lucide-react";
import type { DetailedFeature, Feature } from "@/types";

export const homeFeatures: Feature[] = [
  { id: "executive-summary", icon: FileText, title: "Executive Summary", description: "Board-ready overviews of any judgment, contract, or circular in seconds." },
  { id: "one-page", icon: BookOpenText, title: "One-Page Summary", description: "The essential facts, holdings, and implications condensed to a single page." },
  { id: "30-second", icon: CalendarClock, title: "30-Second Summary", description: "A rapid brief for when you need the gist before a call or hearing." },
  { id: "timeline", icon: CalendarClock, title: "Timeline", description: "Auto-extracted chronology of events, filings, and deadlines." },
  { id: "legal-sections", icon: Scale, title: "Legal Sections", description: "Statutes, sections, and provisions identified and cross-referenced." },
  { id: "case-facts", icon: BookOpenText, title: "Case Facts", description: "Structured facts separated cleanly from analysis and opinion." },
  { id: "arguments", icon: MessageSquareText, title: "Arguments", description: "Petitioner and respondent positions mapped side by side." },
  { id: "final-judgment", icon: Gavel, title: "Final Judgment", description: "The holding, ratio, and orders surfaced with pinpoint citations." },
  { id: "risk-analysis", icon: AlertTriangle, title: "Risk Analysis", description: "Obligations, penalties, and exposure flagged with severity scores." },
  { id: "compliance", icon: ListChecks, title: "Compliance Checklist", description: "Actionable checklists mapped to statutory deadlines." },
  { id: "ask-ai", icon: MessageSquareText, title: "Ask AI", description: "Ask anything and get citation-backed answers grounded in your documents." },
  { id: "comparison", icon: GitCompareArrows, title: "Document Comparison", description: "Redline versions and detect material changes instantly." },
  { id: "multilanguage", icon: Languages, title: "Multi-language", description: "Analyze and summarize documents across regional languages." },
  { id: "client-reports", icon: FileBarChart, title: "Client Reports", description: "Branded, export-ready reports your clients will trust." },
  { id: "security", icon: Lock, title: "Enterprise Security", description: "Encryption in transit, account-level access control, and full audit trails." },
];

export const detailedFeatures: DetailedFeature[] = [
  {
    id: "ai-summaries",
    icon: FileText,
    badge: "Core",
    title: "AI Summaries",
    description:
      "Turn 1000-page judgments and dense circulars into layered summaries. Choose an executive overview, a one-page brief, or a 30-second snapshot — each grounded in the source text.",
    points: [
      "Executive, one-page, and 30-second formats",
      "Every claim linked to its paragraph in the source",
      "Tone and length tuned for your audience",
      "Consistent structure across every summary",
    ],
  },
  {
    id: "legal-intelligence",
    icon: Scale,
    badge: "Core",
    title: "Legal Intelligence",
    description:
      "BriefVault reads like a senior associate. It separates facts from arguments, identifies statutes and precedents, and extracts the ratio decidendi with pinpoint citations.",
    points: [
      "Case facts, issues, arguments, and holdings",
      "Statute and section detection with cross-references",
      "Precedent and citation graph",
      "Jurisdiction-aware analysis",
    ],
  },
  {
    id: "ask-ai",
    icon: MessageSquareText,
    badge: "Popular",
    title: "Ask AI",
    description:
      "Chat with your documents. Ask nuanced legal questions and receive answers backed by exact citations — never a hallucinated one.",
    points: [
      "Citation-backed, grounded answers",
      "Follow-up questions with full context",
      "Query across an entire document set",
      "Copy answers straight into your work product",
    ],
  },
  {
    id: "comparison",
    icon: GitCompareArrows,
    title: "Document Comparison",
    description:
      "Compare contract versions, amended statutes, or successive drafts. BriefVault highlights material changes and explains their legal impact.",
    points: [
      "Semantic redlining beyond plain text diff",
      "Impact analysis on obligations and risk",
      "Version history and audit trail",
      "Side-by-side and unified views",
    ],
  },
  {
    id: "compliance",
    icon: ShieldCheck,
    title: "Compliance",
    description:
      "Convert regulatory documents into living checklists. Track statutory obligations, owners, and due dates in one place.",
    points: [
      "Auto-generated compliance checklists",
      "Statutory deadline and key dates list",
      "Actionable compliance next steps",
      "Monetary and penalty highlights",
    ],
  },
  {
    id: "risk-analysis",
    icon: AlertTriangle,
    title: "Risk Analysis",
    description:
      "Surface hidden liabilities, penalty clauses, and unfavorable terms with severity scoring so you can prioritize what matters.",
    points: [
      "Severity-scored risk flags",
      "Penalty and indemnity detection",
      "Compliance and liability risk highlighting",
      "Risk categorizations (tax, compliance, financial)",
    ],
  },
  {
    id: "timeline",
    icon: CalendarClock,
    title: "Timeline",
    description:
      "Every date, filing, and event automatically arranged into a clear chronology you can share and export.",
    points: [
      "Auto-extracted event chronology",
      "Key date and limitation mapping",
      "Clear chronological sequential layout",
      "Export to PDF reports",
    ],
  },
  {
    id: "reports",
    icon: FileBarChart,
    title: "Reports",
    description:
      "Generate branded, client-ready reports in a click — summaries, risks, timelines, and recommendations in a polished format.",
    points: [
      "Branded, print-ready PDF exports",
      "Preset legal report formats",
      "Executive, client, and compliance briefs",
      "Structured legal opinions",
    ],
  },
  {
    id: "ocr",
    icon: ScanText,
    title: "OCR",
    description:
      "Scanned orders, handwritten notes, and image-only PDFs become fully searchable, analyzable text with high-accuracy OCR.",
    points: [
      "High-accuracy OCR for scanned files",
      "Printed text and layout recognition",
      "Document content text extraction",
      "Searchable across every document",
    ],
  },
  {
    id: "search",
    icon: Search,
    title: "Search",
    description:
      "Find any clause, citation, or concept across your entire library with semantic search that understands legal language.",
    points: [
      "Semantic and keyword search",
      "Filter by jurisdiction, date, and type",
      "Concept and clause-level results",
      "Instant previews with highlights",
    ],
  },
  {
    id: "enterprise",
    icon: Lock,
    badge: "Enterprise",
    title: "Enterprise Features",
    description:
      "Everything larger teams need: role-based access, dedicated onboarding, and complete audit trails.",
    points: [
      "Role-based access control",
      "Dedicated onboarding & support",
      "Custom usage limits",
      "Full audit logs",
    ],
  },
];
