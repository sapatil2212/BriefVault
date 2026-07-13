/**
 * Document cleaning. Normalizes whitespace and strips common extraction noise
 * (page headers/footers, hyphenation at line breaks, control characters) while
 * preserving paragraph structure needed by the chunker.
 */
export function cleanText(raw: string): string {
  let text = raw
    // Normalize line endings and remove non-printable control chars.
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    // Join words hyphenated across line breaks: "compli-\nance" -> "compliance".
    .replace(/(\w)-\n(\w)/g, "$1$2")
    // Collapse 3+ blank lines into a single paragraph break.
    .replace(/\n{3,}/g, "\n\n")
    // Trim trailing spaces on each line.
    .replace(/[ \t]+\n/g, "\n");

  // Drop obvious standalone page-number lines (e.g. "Page 3", "- 12 -").
  text = text
    .split("\n")
    .filter((line) => !/^\s*(page\s+)?[-–]?\s*\d{1,4}\s*[-–]?\s*$/i.test(line))
    .join("\n");

  return text.trim();
}

/** Rough token estimate (~4 chars/token) for budgeting without a tokenizer. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Naive language guess: English vs. non-Latin script share. */
export function detectLanguage(text: string): string {
  const sample = text.slice(0, 4000);
  const latin = (sample.match(/[a-zA-Z]/g) ?? []).length;
  const nonLatin = (sample.match(/[^\u0000-\u007F]/g) ?? []).length;
  if (nonLatin > latin) return "und"; // undetermined non-Latin script
  return "en";
}
