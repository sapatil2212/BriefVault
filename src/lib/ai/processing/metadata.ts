/**
 * Rule-based legal metadata extraction.
 *
 * This is deliberately deterministic (regex/heuristics) rather than LLM-based:
 * metadata like case numbers, statute citations and dates must be precise and
 * explainable, and should never be fabricated. An LLM refinement pass can be
 * layered on top later, but the grounded extraction lives here.
 */

export interface ExtractedMetadata {
  documentTitle: string | null;
  court: string | null;
  authority: string | null;
  judge: string | null;
  caseNumber: string | null;
  parties: { petitioner: string[]; respondent: string[] } | null;
  decisionDate: string | null; // ISO date string
  notificationNumber: string | null;
  circularNumber: string | null;
  acts: string[];
  sections: string[];
  regulations: string[];
  keywords: string[];
  /** 0–1 heuristic confidence based on how many fields were resolved. */
  confidence: number;
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function firstMatch(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  return m ? (m[1] ?? m[0]).trim() : null;
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()))).filter(Boolean);
}

function parseDate(text: string): string | null {
  // e.g. "12th March, 2021" or "March 12, 2021"
  const dmy = /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(\d{4})/.exec(text);
  if (dmy && MONTHS[dmy[2].toLowerCase()]) {
    const [, d, mon, y] = dmy;
    const date = new Date(Date.UTC(+y, MONTHS[mon.toLowerCase()] - 1, +d));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const mdy = /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/.exec(text);
  if (mdy && MONTHS[mdy[1].toLowerCase()]) {
    const [, mon, d, y] = mdy;
    const date = new Date(Date.UTC(+y, MONTHS[mon.toLowerCase()] - 1, +d));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  // Numeric dd/mm/yyyy or dd-mm-yyyy
  const num = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/.exec(text);
  if (num) {
    const [, d, m, y] = num;
    const date = new Date(Date.UTC(+y, +m - 1, +d));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

export function extractMetadata(text: string): ExtractedMetadata {
  const head = text.slice(0, 6000);

  const court = firstMatch(
    head,
    /\b((?:Supreme Court|High Court(?:\s+of\s+[A-Z][a-zA-Z ]+)?|District Court|Tribunal|[A-Z][a-zA-Z ]*?(?:Appellate|Income Tax|Consumer|National Company Law)\s+Tribunal))\b/
  );

  const judge = firstMatch(
    head,
    /\b(?:before|coram|hon(?:'|')?ble)\s*:?\s*(?:justice|j\.|mr\.?\s+justice)?\s*([A-Z][A-Za-z.\s]{3,40})/i
  );

  const caseNumber = firstMatch(
    head,
    /\b((?:civil|criminal|writ|special\s+leave|company)?\s*(?:appeal|petition|application|suit|slp|c\.a\.|w\.p\.)\s*(?:no\.?|number)\s*\.?\s*[:.]?\s*[\dA-Za-z/()-]+(?:\s+of\s+\d{4})?)/i
  );

  const notificationNumber = firstMatch(
    head,
    /notification\s+no\.?\s*[:.]?\s*([\w./()-]+)/i
  );
  const circularNumber = firstMatch(
    head,
    /circular\s+no\.?\s*[:.]?\s*([\w./()-]+)/i
  );

  // Parties: "X vs Y" / "X versus Y"
  let parties: ExtractedMetadata["parties"] = null;
  const vs = /([A-Z][A-Za-z.&,'\s]{2,60}?)\s+(?:vs\.?|versus|v\.)\s+([A-Z][A-Za-z.&,'\s]{2,60})/.exec(
    head
  );
  if (vs) {
    parties = {
      petitioner: [vs[1].replace(/\s+/g, " ").trim()],
      respondent: [vs[2].replace(/\s+/g, " ").trim()],
    };
  }

  // Statute citations
  const acts = uniq(
    (head.match(/\b([A-Z][A-Za-z&,'’\s]+?Act,?\s+\d{4})/g) ?? []).map((s) =>
      s.replace(/\s+/g, " ").trim()
    )
  );
  const sections = uniq(
    (text.match(/\b(?:section|sec\.?|s\.)\s*(\d+[A-Za-z]*(?:\(\w+\))?)/gi) ?? []).map((s) =>
      s.replace(/\s+/g, " ").trim()
    )
  ).slice(0, 40);
  const regulations = uniq(
    (text.match(/\b(?:regulation|rule|article)\s*(\d+[A-Za-z]*)/gi) ?? []).map((s) =>
      s.replace(/\s+/g, " ").trim()
    )
  ).slice(0, 40);

  const decisionDate = parseDate(head);

  // Title: first substantive non-empty line, capped in length.
  const documentTitle =
    text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 8 && l.length < 160) ?? null;

  // Keywords: most frequent meaningful terms (excludes short/stop-like words).
  const keywords = topKeywords(text, 10);

  // Confidence from field coverage.
  const fields = [court, judge, caseNumber, parties, decisionDate];
  const resolved = fields.filter(Boolean).length;
  const confidence = Math.min(
    1,
    resolved / fields.length * 0.7 + (acts.length ? 0.15 : 0) + (sections.length ? 0.15 : 0)
  );

  return {
    documentTitle,
    court,
    authority: court ? null : firstMatch(head, /\b(Ministry of [A-Z][a-zA-Z ]+|Reserve Bank of India|SEBI|CBDT|CBIC|Income Tax Department)\b/),
    judge,
    caseNumber,
    parties,
    decisionDate,
    notificationNumber,
    circularNumber,
    acts,
    sections,
    regulations,
    keywords,
    confidence: Number(confidence.toFixed(2)),
  };
}

const KEYWORD_STOP = new Set([
  "the", "and", "for", "that", "this", "with", "from", "shall", "have", "which",
  "been", "were", "their", "such", "into", "upon", "said", "would", "there",
  "these", "than", "then", "them", "also", "any", "was", "are", "not", "under",
  "section", "act", "court", "case", "order", "appeal", "petition",
]);

function topKeywords(text: string, n: number): string[] {
  const freq = new Map<string, number>();
  for (const w of text.toLowerCase().match(/[a-z][a-z'-]{4,}/g) ?? []) {
    if (KEYWORD_STOP.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}
