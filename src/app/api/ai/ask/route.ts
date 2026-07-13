import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { askSchema } from "@/lib/validations/ai";
import { askQuestion } from "@/lib/ai/modules/ask";
import {
  getOwnedDocument,
  getUserDocumentIds,
} from "@/lib/ai/services/document-service";
import { checkAiQuestionAllowed } from "@/lib/subscriptions/service";
import { logAiRequest } from "@/lib/ai/logging";

export const runtime = "nodejs";

/**
 * POST /api/ai/ask
 * RAG question answering. Scoped to one document (`documentId`) or, by default,
 * all of the caller's processed documents. Returns a grounded answer with
 * citations and the retrieved source chunks.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  // Enforce monthly AI question quota
  const quotaCheck = await checkAiQuestionAllowed(user.id);
  if (!quotaCheck.allowed) {
    return fail(quotaCheck.message ?? "AI question limit reached.", {
      status: 402,
      code: "QUESTION_LIMIT",
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  try {
    const { question, documentId } = askSchema.parse(body);

    let scope: string[];
    if (documentId) {
      const doc = await getOwnedDocument(user.id, documentId);
      if (!doc) {
        return fail("Document not found.", { status: 404, code: ErrorCode.NOT_FOUND });
      }
      scope = [documentId];
    } else {
      scope = await getUserDocumentIds(user.id);
    }

    const startedAt = Date.now();
    const result = await askQuestion(question, scope);

    await logAiRequest({
      userId: user.id,
      documentId: documentId ?? null,
      kind: "ASK",
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: Date.now() - startedAt,
      confidence: result.confidence,
      success: !result.notFound,
    });

    return ok(
      {
        answer: result.payload.answer,
        sources: result.payload.sources,
        citations: result.citations,
        confidence: result.confidence,
        provider: result.provider,
        notFound: result.notFound ?? false,
      },
      result.notFound ? "No grounded answer found." : "OK"
    );
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Please check your input.", {
        status: 422,
        code: ErrorCode.VALIDATION,
        error: err.issues.map((i) => i.message).join("; "),
      });
    }
    console.error("[ai/ask] error:", err);
    return fail("Failed to answer question.", {
      status: 500,
      code: ErrorCode.INTERNAL,
    });
  }
}
