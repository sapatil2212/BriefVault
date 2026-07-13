import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { processDocumentSchema } from "@/lib/validations/document";
import { createAndProcessDocument } from "@/lib/ai/services/document-service";
import { UnsupportedFormatError } from "@/lib/ai/extraction";
import { checkUploadAllowed } from "@/lib/subscriptions/service";

export const runtime = "nodejs";

/**
 * POST /api/documents/process
 * Create a document from text and run (or enqueue) the AI pipeline.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  // Enforce plan document-count limit (no file size for text documents)
  const limitCheck = await checkUploadAllowed(user.id);
  if (!limitCheck.allowed) {
    return fail(limitCheck.message ?? "Upload not allowed.", {
      status: 403,
      code: "PLAN_LIMIT_EXCEEDED",
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  try {
    const input = processDocumentSchema.parse(body);
    const doc = await createAndProcessDocument(user.id, input);
    return ok(doc, input.sync ? "Document processed." : "Document accepted for processing.", {
      status: 201,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Please check your input.", {
        status: 422,
        code: ErrorCode.VALIDATION,
        error: err.issues.map((i) => i.message).join("; "),
      });
    }
    if (err instanceof UnsupportedFormatError) {
      return fail(err.message, { status: 415, code: ErrorCode.UNSUPPORTED });
    }
    console.error("[documents/process] error:", err);
    return fail("Failed to process document.", {
      status: 500,
      code: ErrorCode.INTERNAL,
    });
  }
}

