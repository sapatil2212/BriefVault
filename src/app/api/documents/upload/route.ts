import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { createDocumentFromUpload } from "@/lib/ai/services/document-service";
import { FileTooLargeError } from "@/lib/storage";
import { checkUploadAllowed } from "@/lib/subscriptions/service";

export const runtime = "nodejs";

/**
 * POST /api/documents/upload  (multipart/form-data)
 * Fields: file (required), title (optional), sync (optional "true").
 *
 * The file is always stored; text extraction + AI processing run for supported
 * types (Phase 1: plain text). Unsupported types are retained for a later
 * extractor/OCR pass.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Expected multipart/form-data.", {
      status: 400,
      code: ErrorCode.VALIDATION,
    });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail("A 'file' field is required.", {
      status: 422,
      code: ErrorCode.VALIDATION,
    });
  }

  const title = (form.get("title") as string | null)?.toString();
  const folderId = (form.get("folderId") as string | null)?.toString() || null;
  const sync = (form.get("sync") as string | null) === "true";

  // Enforce plan limits before reading the entire buffer
  const limitCheck = await checkUploadAllowed(user.id, file.size);
  if (!limitCheck.allowed) {
    return fail(limitCheck.message ?? "Upload not allowed.", {
      status: 403,
      code: "PLAN_LIMIT_EXCEEDED",
    });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const doc = await createDocumentFromUpload(user.id, {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
      title,
      folderId,
      sync,
    });

    const processed = Boolean(doc?.rawText);
    return ok(
      doc,
      processed
        ? sync
          ? "Document uploaded and processed."
          : "Document uploaded; processing started."
        : "File uploaded. Text extraction for this type isn't available yet.",
      { status: 201, meta: { processed } }
    );
  } catch (err) {
    if (err instanceof FileTooLargeError) {
      return fail(err.message, { status: 413, code: "FILE_TOO_LARGE" });
    }
    console.error("[documents/upload] error:", err);
    return fail("Failed to upload document.", {
      status: 500,
      code: ErrorCode.INTERNAL,
    });
  }
}

