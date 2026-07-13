import type { NavColumn, NavItem } from "@/constants/site";

export const featureMenu: NavColumn[] = [
  {
    title: "Analysis",
    items: [
      { label: "AI Summaries", href: "/features#ai-summaries", description: "Executive, one-page & 30-second briefs" },
      { label: "Legal Intelligence", href: "/features#legal-intelligence", description: "Sections, facts, arguments & holdings" },
      { label: "Ask AI", href: "/features#ask-ai", description: "Citation-backed answers on any document" },
      { label: "Risk Analysis", href: "/features#risk-analysis", description: "Surface obligations, penalties & exposure" },
    ],
  },
  {
    title: "Workflow",
    items: [
      { label: "Document Comparison", href: "/features#comparison", description: "Redline versions & track changes" },
      { label: "Compliance", href: "/features#compliance", description: "Checklists mapped to deadlines" },
      { label: "Timeline", href: "/features#timeline", description: "Auto-built chronology of events" },
      { label: "Reports", href: "/features#reports", description: "Branded client-ready exports" },
    ],
  },
];

export const solutionsMenu: NavItem[] = [
  { label: "Law Firms", href: "/solutions#law-firms", description: "Draft, review & research faster" },
  { label: "Chartered Accountants", href: "/solutions#chartered-accountants", description: "Parse circulars & notifications" },
  { label: "Company Secretaries", href: "/solutions#company-secretaries", description: "Stay ahead of filings" },
  { label: "Tax Consultants", href: "/solutions#tax-consultants", description: "Decode tax rulings instantly" },
  { label: "Corporate Legal", href: "/solutions#corporate-legal", description: "Contract intelligence at scale" },
  { label: "Banks & NBFCs", href: "/solutions#banks-nbfcs", description: "Regulatory monitoring" },
  { label: "Government", href: "/solutions#government", description: "Policy & case analysis" },
  { label: "Startups", href: "/solutions#startups", description: "Founder-friendly legal ops" },
];

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const footerNav: NavColumn[] = [
  {
    title: "Product",
    items: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Refund & Cancellation Policy", href: "/refund-policy" },
      { label: "Shipping & Delivery Policy", href: "/shipping-policy" },
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Security Policy", href: "/security-policy" },
    ],
  },
];
