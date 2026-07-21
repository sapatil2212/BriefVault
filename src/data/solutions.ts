import {
  Scale,
  Calculator,
  FileSignature,
  Receipt,
  Building2,
  Landmark,
  ShieldCheck,
  Rocket,
} from "lucide-react";
import type { Solution } from "@/types";

export const solutions: Solution[] = [
  {
    id: "law-firms",
    icon: Scale,
    title: "Law Firms",
    description:
      "Cut research and review time dramatically. Brief matters, compare drafts, and answer client questions with citation-backed confidence.",
    outcomes: ["10x faster case research", "Draft review in minutes", "Citation-backed memos"],
  },
  {
    id: "chartered-accountants",
    icon: Calculator,
    title: "Chartered Accountants",
    description:
      "Parse circulars, notifications, and rulings the moment they drop. Understand impact and act before deadlines slip.",
    outcomes: ["Instant circular analysis", "Deadline tracking", "Client-ready notes"],
  },
  {
    id: "company-secretaries",
    icon: FileSignature,
    title: "Company Secretaries",
    description:
      "Stay ahead of filings and board obligations with auto-generated compliance checklists and timelines.",
    outcomes: ["Statutory timelines", "Board pack summaries", "Compliance checklists"],
  },
  {
    id: "tax-consultants",
    icon: Receipt,
    title: "Tax Consultants",
    description:
      "Decode complex tax rulings and assessment orders instantly, with the exact provisions and precedents cited.",
    outcomes: ["Ruling breakdowns", "Provision mapping", "Risk flags"],
  },
  {
    id: "corporate-legal",
    icon: Building2,
    title: "Corporate Legal Teams",
    description:
      "Bring contract intelligence to scale. Review, compare, and monitor obligations across your agreements.",
    outcomes: ["Contract intelligence", "Obligation tracking", "Contract risk mapping"],
  },
  {
    id: "banks-nbfcs",
    icon: Landmark,
    title: "Banks & NBFCs",
    description:
      "Analyze regulatory documents and find risk exposure across your library with full audit trails.",
    outcomes: ["Regulatory analysis", "Exposure analysis", "Audit-ready trails"],
  },
  {
    id: "government",
    icon: ShieldCheck,
    title: "Government",
    description:
      "Analyze policy, case law, and public submissions at scale with secure, on-premise deployment options.",
    outcomes: ["Policy analysis", "Case law review", "Private deployment"],
  },
  {
    id: "startups",
    icon: Rocket,
    title: "Startups",
    description:
      "Founder-friendly legal operations. Understand contracts, term sheets, and compliance without a full legal team.",
    outcomes: ["Contract clarity", "Term-sheet review", "Lean compliance"],
  },
];
