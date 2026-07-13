import type { AiResultKind } from "@prisma/client";
import type { RetrievedChunk } from "@/lib/ai/types";
import { extractiveSummarize, splitSentences } from "@/lib/ai/providers/llm";
import {
  sectionsSchema,
  listSchema,
  riskSchema,
  checklistSchema,
  type AnalysisDef,
  type AnalysisPayload,
} from "./types";

// ── Shared prompt helpers ────────────────────────────────────────────────────

const BASE_SYSTEM = `You are BriefVault's legal analysis engine.
You extract structured intelligence from legal and regulatory documents.
Rules:
- Use ONLY the provided context. Never invent facts, names, dates, or citations.
- If a field or item is not supported by the context, omit it or set it to null.
- Respond with a single valid JSON object and nothing else.`;

function renderContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c) => {
      const loc = [
        c.heading ? `heading: ${c.heading}` : null,
        c.page != null ? `page: ${c.page}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `[#${c.chunkId}]${loc ? ` (${loc})` : ""}\n${c.content}`;
    })
    .join("\n\n---\n\n");
}

const REF_INSTRUCTION = `Each object must include "ref": the id of the single context block that best supports it, copied exactly from its [#id] marker (e.g. "abc123"). Use null only when no block supports it.`;

function sectionsUser(headings: string[], instructions: string) {
  return (title: string, chunks: RetrievedChunk[]) =>
    `Document: ${title}

${instructions}
Return JSON: { "sections": [{ "heading": string, "body": string | null, "ref": string | null }] }
Use exactly these headings in order: ${headings.map((h) => `"${h}"`).join(", ")}.
Set "body" to null for any heading not supported by the context.
${REF_INSTRUCTION}

CONTEXT:
${renderContext(chunks)}`;
}

function listUser(itemDescription: string, tagHint?: string) {
  return (title: string, chunks: RetrievedChunk[]) =>
    `Document: ${title}

${itemDescription}
Return JSON: { "items": [{ "title": string, "detail": string | null${tagHint ? `, "tag": string | null` : ""}, "ref": string | null }] }
${tagHint ? `"tag" should be one of: ${tagHint}.\n` : ""}Only include items grounded in the context. Return an empty array if none.
${REF_INSTRUCTION}

CONTEXT:
${renderContext(chunks)}`;
}

function riskUser() {
  return (title: string, chunks: RetrievedChunk[]) =>
    `Document: ${title}

Assess legal/compliance risk from the context. Consider compliance, tax, financial and litigation risk.
Return JSON: { "risks": [{ "category": string, "level": "Low"|"Medium"|"High", "reasoning": string }] }
Base each assessment strictly on the context. Return an empty array if no risk is evident.

CONTEXT:
${renderContext(chunks)}`;
}

function checklistUser() {
  return (title: string, chunks: RetrievedChunk[]) =>
    `Document: ${title}

Generate an actionable compliance checklist from the obligations in the context.
Return JSON: { "items": [{ "label": string, "done": false }] }
Only include actions grounded in the context.

CONTEXT:
${renderContext(chunks)}`;
}

// ── Shared fallback builders (deterministic, grounded) ───────────────────────

function sectionsFallback(headings: string[]) {
  return (_t: string, _f: string, chunks: RetrievedChunk[]): AnalysisPayload => {
    const combined = chunks.map((c) => c.content).join("\n\n");
    const overview = extractiveSummarize(combined, 3);
    const first = chunks[0];
    return {
      sections: headings.map((heading, i) => ({
        heading,
        body: i === 0 ? overview || null : null,
        ref: i === 0 && first ? first.chunkId : null,
        page: i === 0 ? first?.page ?? null : null,
        paragraph: i === 0 ? first?.paragraph ?? null : null,
      })),
    };
  };
}

function listFallback(max = 8) {
  return (_t: string, _f: string, chunks: RetrievedChunk[]): AnalysisPayload => ({
    items: chunks.slice(0, max).map((c) => ({
      title: c.heading ?? (c.page != null ? `Page ${c.page}` : "Excerpt"),
      detail: c.content.slice(0, 200),
      tag: null,
      ref: c.chunkId,
      page: c.page ?? null,
      paragraph: c.paragraph ?? null,
    })),
  });
}

const OBLIGATION_RE = /\b(shall|must|required to|is required|liable to|obligated|due (?:on|by)|within \d+ days)\b/i;

function checklistFallback(): (
  t: string,
  f: string,
  c: RetrievedChunk[]
) => AnalysisPayload {
  return (_t, fullText) => {
    const sentences = splitSentences(fullText)
      .filter((s) => OBLIGATION_RE.test(s))
      .slice(0, 10);
    return {
      items: sentences.map((s) => ({ label: s.slice(0, 200), done: false })),
    };
  };
}

function riskFallback(): (t: string, f: string, c: RetrievedChunk[]) => AnalysisPayload {
  return () => ({
    risks: [
      {
        category: "General",
        level: "Low",
        reasoning:
          "Automated review did not detect explicit risk indicators in the extracted text. Manual review by a professional is recommended.",
      },
    ],
  });
}

// ── Registry ─────────────────────────────────────────────────────────────────

const defs: AnalysisDef[] = [
  {
    kind: "ONE_PAGE_SUMMARY",
    label: "One-Page Summary",
    description: "Structured single-page summary.",
    group: "summary",
    render: "sections",
    system: BASE_SYSTEM,
    buildUser: sectionsUser(
      ["Overview", "Purpose", "Background", "Main Issue", "Arguments", "Decision", "Impact", "Conclusion"],
      "Produce a concise one-page summary."
    ),
    schema: sectionsSchema,
    fallback: sectionsFallback([
      "Overview", "Purpose", "Background", "Main Issue", "Arguments", "Decision", "Impact", "Conclusion",
    ]),
  },
  {
    kind: "QUICK_SUMMARY",
    label: "Quick Summary",
    description: "30-second overview.",
    group: "summary",
    render: "sections",
    system: BASE_SYSTEM,
    buildUser: sectionsUser(
      ["Key Change", "Why It Matters", "Effective Date", "Who Is Affected", "Recommended Action"],
      "Produce a 30-second summary."
    ),
    schema: sectionsSchema,
    fallback: sectionsFallback([
      "Key Change", "Why It Matters", "Effective Date", "Who Is Affected", "Recommended Action",
    ]),
  },
  {
    kind: "KEY_HIGHLIGHTS",
    label: "Key Highlights",
    description: "Important points, categorized.",
    group: "summary",
    render: "list",
    system: BASE_SYSTEM,
    buildUser: listUser(
      "Extract 10-30 important points.",
      '"Change", "Compliance", "Penalty", "Clarification", "Obligation"'
    ),
    schema: listSchema,
    fallback: listFallback(12),
  },
  {
    kind: "TIMELINE",
    label: "Timeline",
    description: "Chronological events.",
    group: "summary",
    render: "list",
    system: BASE_SYSTEM,
    buildUser: listUser(
      "Extract a chronological timeline. Use the date as the item title and the event as the detail."
    ),
    schema: listSchema,
    fallback: listFallback(10),
  },
  {
    kind: "CASE_FACTS",
    label: "Case Facts",
    description: "Background, facts, events, evidence.",
    group: "litigation",
    render: "sections",
    system: BASE_SYSTEM,
    buildUser: sectionsUser(
      ["Background", "Facts", "Events", "Evidence", "Dispute"],
      "Extract the case facts."
    ),
    schema: sectionsSchema,
    fallback: sectionsFallback(["Background", "Facts", "Events", "Evidence", "Dispute"]),
  },
  {
    kind: "QUESTIONS_BEFORE_COURT",
    label: "Questions Before Court",
    description: "Legal questions considered.",
    group: "litigation",
    render: "list",
    system: BASE_SYSTEM,
    buildUser: listUser("Identify each legal question considered by the court."),
    schema: listSchema,
    fallback: listFallback(8),
  },
  {
    kind: "ARGUMENTS",
    label: "Arguments",
    description: "Positions by party.",
    group: "litigation",
    render: "sections",
    system: BASE_SYSTEM,
    buildUser: sectionsUser(
      ["Petitioner", "Respondent", "Government / Authority", "Court Observations"],
      "Separate the arguments by party."
    ),
    schema: sectionsSchema,
    fallback: sectionsFallback([
      "Petitioner", "Respondent", "Government / Authority", "Court Observations",
    ]),
  },
  {
    kind: "FINAL_DECISION",
    label: "Final Decision",
    description: "Outcome and relief.",
    group: "litigation",
    render: "sections",
    system: BASE_SYSTEM,
    buildUser: sectionsUser(
      ["Outcome", "Relief Granted", "Reasoning"],
      "State the final decision (allowed / dismissed / remanded / stay / penalty)."
    ),
    schema: sectionsSchema,
    fallback: sectionsFallback(["Outcome", "Relief Granted", "Reasoning"]),
  },
  {
    kind: "RATIO_DECIDENDI",
    label: "Ratio Decidendi",
    description: "Binding legal principle.",
    group: "litigation",
    render: "sections",
    system: BASE_SYSTEM,
    buildUser: sectionsUser(
      ["Binding Principle"],
      "Extract the binding legal principle (ratio decidendi)."
    ),
    schema: sectionsSchema,
    fallback: sectionsFallback(["Binding Principle"]),
  },
  {
    kind: "OBITER_DICTA",
    label: "Obiter Dicta",
    description: "Persuasive observations.",
    group: "litigation",
    render: "list",
    system: BASE_SYSTEM,
    buildUser: listUser("Extract judicial observations that are persuasive but not binding."),
    schema: listSchema,
    fallback: listFallback(6),
  },
  {
    kind: "SECTIONS_OF_LAW",
    label: "Sections of Law",
    description: "Articles, acts, sections, rules.",
    group: "references",
    render: "list",
    system: BASE_SYSTEM,
    buildUser: listUser(
      "Identify each Constitution article, Act, section, rule, regulation or notification referenced. Use the reference as the title and its context as the detail."
    ),
    schema: listSchema,
    fallback: listFallback(15),
  },
  {
    kind: "CASE_CITATIONS",
    label: "Case Citations",
    description: "Cited judgments & precedents.",
    group: "references",
    render: "list",
    system: BASE_SYSTEM,
    buildUser: listUser("Extract each cited judgment or legal precedent."),
    schema: listSchema,
    fallback: listFallback(10),
  },
  {
    kind: "IMPORTANT_PARAGRAPHS",
    label: "Important Paragraphs",
    description: "Most significant passages.",
    group: "references",
    render: "list",
    system: BASE_SYSTEM,
    buildUser: listUser(
      "Identify the most significant paragraphs. Use the page/paragraph reference as the title and the passage as the detail."
    ),
    schema: listSchema,
    fallback: listFallback(8),
  },
  {
    kind: "RISK_ANALYSIS",
    label: "Risk Analysis",
    description: "Compliance, tax, financial, litigation risk.",
    group: "compliance",
    render: "risk",
    system: BASE_SYSTEM,
    buildUser: riskUser(),
    schema: riskSchema,
    fallback: riskFallback(),
  },
  {
    kind: "COMPLIANCE_CHECKLIST",
    label: "Compliance Checklist",
    description: "Actionable obligations.",
    group: "compliance",
    render: "checklist",
    system: BASE_SYSTEM,
    buildUser: checklistUser(),
    schema: checklistSchema,
    fallback: checklistFallback(),
  },
  {
    kind: "ACTION_ITEMS",
    label: "Action Items",
    description: "Practical next steps.",
    group: "compliance",
    render: "list",
    system: BASE_SYSTEM,
    buildUser: listUser(
      "Generate practical next steps for the client. Use the action as the title and the priority (High/Medium/Low) as the tag.",
      '"High", "Medium", "Low"'
    ),
    schema: listSchema,
    fallback: listFallback(8),
  },
  {
    kind: "DEADLINES",
    label: "Deadlines & Dates",
    description: "Statutory deadlines and key dates.",
    group: "compliance",
    render: "list",
    system: BASE_SYSTEM,
    buildUser: listUser(
      "Extract all deadlines, effective/filing/hearing/compliance dates. Use the date as the title and what it applies to as the detail."
    ),
    schema: listSchema,
    fallback: listFallback(10),
  },
  {
    kind: "MONETARY_INFO",
    label: "Monetary Information",
    description: "Amounts: tax, penalty, refund, etc.",
    group: "compliance",
    render: "list",
    system: BASE_SYSTEM,
    buildUser: listUser(
      "Extract monetary amounts (tax, penalty, interest, refund, compensation, fine, damages). Use the type as the title and the amount as the detail.",
      '"Tax", "Penalty", "Interest", "Refund", "Compensation", "Fine", "Damages"'
    ),
    schema: listSchema,
    fallback: listFallback(10),
  },
];

const registry = new Map<AiResultKind, AnalysisDef>(defs.map((d) => [d.kind, d]));

/** All analysis kinds handled by the generic engine (excludes EXECUTIVE_SUMMARY). */
export const analysisDefs = defs;

export function getAnalysisDef(kind: AiResultKind): AnalysisDef | undefined {
  return registry.get(kind);
}
