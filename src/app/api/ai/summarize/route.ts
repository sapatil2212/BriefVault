import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { summarizeSchema } from "@/lib/validations/document";
import { getOwnedDocument } from "@/lib/ai/services/document-service";
import { getOrCreateExecutiveSummary } from "@/lib/ai/services/summary-service";

export const runtime = "nodejs";

/**
 * POST /api/ai/summarize
 * Return (or regenerate) the Executive Summary for an owned document.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  try {
    const { documentId, force } = summarizeSchema.parse(body);

    // Authorization: ensure the document belongs to the caller.
    const doc = await getOwnedDocument(user.id, documentId);
    if (!doc) {
      return fail("Document not found.", { status: 404, code: ErrorCode.NOT_FOUND });
    }

    const { cached, result } = await getOrCreateExecutiveSummary(documentId, force);
    return ok(
      {
        kind: result.kind,
        payload: result.payload,
        citations: result.citations,
        confidence: result.confidence,
        provider: result.provider,
        model: result.model,
      },
      cached ? "Returned cached summary." : "Summary generated.",
      { meta: { cached } }
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Please check your input.", {
        status: 422,
        code: ErrorCode.VALIDATION,
        error: err.issues.map((i) => i.message).join("; "),
      });
    }
    const message = err instanceof Error ? err.message : "Failed to summarize.";
    if (message.includes("not been processed")) {
      return fail(message, { status: 409, code: "NOT_PROCESSED" });
    }
    console.error("[ai/summarize] error:", err);
    return fail("Failed to generate summary.", {
      status: 500,
      code: ErrorCode.INTERNAL,
    });
  }
}
