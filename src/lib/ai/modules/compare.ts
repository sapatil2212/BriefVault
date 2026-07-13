/**
 * Sentence-level document comparison.
 *
 * Deterministic, dependency-free diff: documents are split into sentences,
 * aligned with an LCS edit script, and adjacent delete/insert runs that are
 * lexically similar are reclassified as "modified". Grounded and explainable —
 * ideal for comparing circulars, notifications, judgments and contracts.
 */

export type DiffType = "equal" | "added" | "removed" | "modified";

export interface DiffSegment {
  type: DiffType;
  /** Text on the "before" (A) side; null for pure additions. */
  before: string | null;
  /** Text on the "after" (B) side; null for pure removals. */
  after: string | null;
  /** 0–1 similarity for modified pairs. */
  similarity?: number;
}

export interface CompareResult {
  segments: DiffSegment[];
  stats: { added: number; removed: number; modified: number; unchanged: number };
  /** 0–1 overall similarity (unchanged share of aligned content). */
  similarity: number;
}

const MAX_SENTENCES = 1200;

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?;])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SENTENCES);
}

/** Jaccard similarity over word sets. */
function similarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []);
  const wb = new Set(b.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []);
  if (wa.size === 0 && wb.size === 0) return 1;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  const union = wa.size + wb.size - inter;
  return union === 0 ? 0 : inter / union;
}

type Op = { type: "equal" | "delete" | "insert"; a?: string; b?: string };

/** LCS-based edit script over two sentence arrays. */
function lcsDiff(a: string[], b: string[]): Op[] {
  const n = a.length;
  const m = b.length;
  // DP table of LCS lengths.
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", a: a[i], b: b[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "delete", a: a[i] });
      i++;
    } else {
      ops.push({ type: "insert", b: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: "delete", a: a[i++] });
  while (j < m) ops.push({ type: "insert", b: b[j++] });
  return ops;
}

/** Compare two texts and produce classified diff segments + stats. */
export function compareTexts(textA: string, textB: string): CompareResult {
  const a = splitSentences(textA);
  const b = splitSentences(textB);
  const ops = lcsDiff(a, b);

  const segments: DiffSegment[] = [];
  const stats = { added: 0, removed: 0, modified: 0, unchanged: 0 };

  for (let k = 0; k < ops.length; k++) {
    const op = ops[k];
    if (op.type === "equal") {
      segments.push({ type: "equal", before: op.a!, after: op.b! });
      stats.unchanged++;
      continue;
    }

    // Pair an adjacent delete+insert as a possible "modified" segment.
    if (op.type === "delete" && ops[k + 1]?.type === "insert") {
      const next = ops[k + 1];
      const sim = similarity(op.a!, next.b!);
      if (sim >= 0.4) {
        segments.push({ type: "modified", before: op.a!, after: next.b!, similarity: sim });
        stats.modified++;
        k++; // consume the paired insert
        continue;
      }
    }

    if (op.type === "delete") {
      segments.push({ type: "removed", before: op.a!, after: null });
      stats.removed++;
    } else {
      segments.push({ type: "added", before: null, after: op.b! });
      stats.added++;
    }
  }

  const aligned = stats.added + stats.removed + stats.modified + stats.unchanged;
  const similarityScore = aligned === 0 ? 1 : stats.unchanged / aligned;

  return { segments, stats, similarity: Number(similarityScore.toFixed(2)) };
}
