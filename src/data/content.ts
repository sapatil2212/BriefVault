import {
  Upload,
  BrainCircuit,
  FileText,
  AlertTriangle,
  ListTodo,
  FileBarChart,
} from "lucide-react";
import type { FaqItem, Stat, Testimonial, WorkflowStep } from "@/types";

export const problems = [
  {
    title: "1000+ page judgments",
    description: "Landmark rulings and orders that take days to read and digest fully.",
  },
  {
    title: "Manual research",
    description: "Hours spent hunting for the relevant section, precedent, or clause.",
  },
  {
    title: "Missed deadlines",
    description: "Statutory limitation periods buried deep inside dense documents.",
  },
  {
    title: "Compliance risk",
    description: "Obligations and penalties that slip through manual review.",
  },
  {
    title: "Slow client response",
    description: "Clients waiting days for answers you could give in minutes.",
  },
  {
    title: "Fragmented tools",
    description: "Context scattered across PDFs, email, and disconnected apps.",
  },
];

export const workflow: WorkflowStep[] = [
  { id: "upload", icon: Upload, title: "Upload", description: "Drag in judgments, contracts, circulars, or notifications — any format." },
  { id: "analysis", icon: BrainCircuit, title: "AI Analysis", description: "BriefVault reads, structures, and understands every page." },
  { id: "summary", icon: FileText, title: "Summary", description: "Get layered summaries, facts, arguments, and holdings." },
  { id: "risk", icon: AlertTriangle, title: "Risk", description: "Obligations, penalties, and exposure flagged with severity." },
  { id: "actions", icon: ListTodo, title: "Actions", description: "Deadlines and compliance tasks ready to assign and track." },
  { id: "reports", icon: FileBarChart, title: "Reports", description: "Export polished, citation-backed client reports in a click." },
];

export const whyBriefVault = [
  {
    title: "Grounded, never guessing",
    description: "Every insight is linked to the exact source paragraph. No hallucinated citations, ever.",
  },
  {
    title: "Built for legal work",
    description: "Trained on the structure of judgments, statutes, and contracts — not generic text.",
  },
  {
    title: "Enterprise-grade security",
    description: "SOC 2 Type II, encryption everywhere, SSO, and private deployment options.",
  },
  {
    title: "Fast to value",
    description: "No lengthy setup. Upload a document and get answers in under a minute.",
  },
];

export const benefits = [
  { stat: "90%", title: "Less reading time", description: "Turn hours of document review into minutes of focused decisions." },
  { stat: "3x", title: "Faster client turnaround", description: "Respond to clients with confidence the same day." },
  { stat: "100%", title: "Citation coverage", description: "Every answer is backed by a verifiable source reference." },
  { stat: "0", title: "Missed deadlines", description: "Automated timelines keep every statutory date in view." },
];

export const stats: Stat[] = [
  { value: 5, suffix: "M+", label: "Documents analyzed" },
  { value: 90, suffix: "%", label: "Reduction in review time" },
  { value: 1200, suffix: "+", label: "Teams onboarded" },
  { value: 99.9, suffix: "%", label: "Uptime SLA" },
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    quote:
      "BriefVault turned a 400-page arbitration award into a one-page brief I could take straight into a client call. It has changed how our team works.",
    name: "Ananya Rao",
    role: "Partner",
    company: "Rao & Associates",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    id: "t2",
    quote:
      "The moment a new circular is released, we upload it and know the impact within minutes. The citation-backed answers are what earned our trust.",
    name: "Vikram Mehta",
    role: "Senior Chartered Accountant",
    company: "Mehta & Co.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "t3",
    quote:
      "We review hundreds of vendor contracts a month. BriefVault's comparison and risk flags catch things our team used to miss.",
    name: "Sarah Chen",
    role: "Head of Legal",
    company: "Northwind Corp",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "t4",
    quote:
      "Security and audit trails were non-negotiable for us. BriefVault passed our review comfortably and deployed in our private cloud.",
    name: "Daniel Okafor",
    role: "CISO",
    company: "Meridian Bank",
    avatar: "https://randomuser.me/api/portraits/men/76.jpg",
  },
  {
    id: "t5",
    quote:
      "As a small firm we don't have researchers. BriefVault gives us the leverage of a much larger team.",
    name: "Priya Nair",
    role: "Founding Attorney",
    company: "Nair Legal",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    id: "t6",
    quote:
      "The timeline extraction alone saves my secretariat team days every quarter. Compliance has never been this calm.",
    name: "Rahul Verma",
    role: "Company Secretary",
    company: "Zenith Industries",
    avatar: "https://randomuser.me/api/portraits/men/54.jpg",
  },
];

export const faqs: FaqItem[] = [
  {
    question: "How accurate are BriefVault's summaries and answers?",
    answer:
      "Every summary and answer is grounded in your source documents, with pinpoint citations to the exact paragraph. BriefVault is designed to never present an insight without a verifiable reference, so you can always check the source.",
  },
  {
    question: "Is my data secure and confidential?",
    answer:
      "Yes. BriefVault is SOC 2 Type II compliant with encryption at rest and in transit, role-based access control, SSO, and full audit trails. Your documents are never used to train shared models, and private and on-premise deployment options are available.",
  },
  {
    question: "What document types can I upload?",
    answer:
      "You can upload judgments, orders, contracts, circulars, notifications, and compliance documents in PDF, DOCX, and image formats. High-accuracy OCR handles scanned and image-only files.",
  },
  {
    question: "Which languages are supported?",
    answer:
      "BriefVault analyzes and summarizes documents across English and major regional languages, with more added regularly. Ask AI can respond in the language you prefer.",
  },
  {
    question: "Can BriefVault handle very large documents?",
    answer:
      "Absolutely. Whether it's a 1000-page judgment or an entire matter with hundreds of files, BriefVault processes them and lets you query across the full set.",
  },
  {
    question: "How do I get started?",
    answer:
      "Book a demo and our team will set you up with a guided pilot on your own documents. There are no long setup cycles — most teams see value on day one.",
  },
];

export const companies = [
  "Meridian Bank",
  "Northwind Corp",
  "Zenith Industries",
  "Rao & Associates",
  "Apex Legal",
  "Summit Group",
  "Vertex Partners",
  "Horizon Trust",
];
