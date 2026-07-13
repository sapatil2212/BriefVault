import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { analyzeSchema } from "@/lib/validations/ai";
import { getOwnedDocument } from "@/lib/ai/services/document-service";
import { getOrCreateAnalysis } from "@/lib/ai/services/analysis-service";
import { checkFeatureAllowed } from "@/lib/subscriptions/service";

export const runtime = "nodejs";

/**
 * POST /api/ai/analyze
 * Generate (or return cached) structured analysis of any supported kind for an
 * owned document. Body: { documentId, kind, force? }.
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
    const { documentId, kind, force } = analyzeSchema.parse(body);

    // Enforce plan feature flag for this analysis kind
    const featureCheck = await checkFeatureAllowed(user.id, kind);
    if (!featureCheck.allowed) {
      return fail(featureCheck.message ?? "Feature not available on your plan.", {
        status: 402,
        code: "FEATURE_GATED",
      });
    }

    const doc = await getOwnedDocument(user.id, documentId);
    if (!doc) {
      return fail("Document not found.", { status: 404, code: ErrorCode.NOT_FOUND });
    }

    const result = await getOrCreateAnalysis(documentId, kind, force);
    return ok(
      {
        kind: result.kind,
        payload: result.payload,
        citations: result.citations,
        confidence: result.confidence,
        provider: result.provider,
        updatedAt: result.updatedAt,
      },
      "OK"
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Please check your input.", {
        status: 422,
        code: ErrorCode.VALIDATION,
        error: err.issues.map((i) => i.message).join("; "),
      });
    }
    const message = err instanceof Error ? err.message : "Analysis failed.";
    if (message.includes("not been processed")) {
      return fail("Document must be processed first.", { status: 409, code: "NOT_PROCESSED" });
    }
    console.error("[ai/analyze] error:", err);
    return fail("Failed to generate analysis.", { status: 500, code: ErrorCode.INTERNAL });
  }
}
