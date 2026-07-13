import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { ZodError } from "zod";
import {
  getDocumentResults,
  softDeleteDocument,
  permanentlyDeleteDocument,
  renameDocument,
} from "@/lib/ai/services/document-service";
import { setDocumentFolder } from "@/lib/folders/service";
import { updateDocumentSchema } from "@/lib/validations/document";
import { logAudit } from "@/lib/audit/service";

export const runtime = "nodejs";

/** GET /api/documents/:id — full document (metadata + AI results). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  const { id } = await params;
  const doc = await getDocumentResults(user.id, id);
  if (!doc) {
    return fail("Document not found.", { status: 404, code: ErrorCode.NOT_FOUND });
  }
  return ok(doc, "OK");
}

/**
 * PATCH /api/documents/:id — rename and/or move between folders.
 * Body: { title?: string, folderId?: string | null }.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  try {
    const input = updateDocumentSchema.parse(body);

    if (input.title !== undefined) {
      const renamed = await renameDocument(user.id, id, input.title);
      if (!renamed) {
        return fail("Document not found.", { status: 404, code: ErrorCode.NOT_FOUND });
      }
      await logAudit({
        userId: user.id,
        action: "document.rename",
        entity: "document",
        entityId: id,
        metadata: { title: input.title },
      });
    }

    if (input.folderId !== undefined) {
      const moved = await setDocumentFolder(user.id, id, input.folderId);
      if (!moved) {
        return fail("Document or folder not found.", {
          status: 404,
          code: ErrorCode.NOT_FOUND,
        });
      }
    }

    return ok({ id, ...input }, "Document updated.");
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Please check your input.", {
        status: 422,
        code: ErrorCode.VALIDATION,
        error: err.issues.map((i) => i.message).join("; "),
      });
    }
    console.error("[documents PATCH] error:", err);
    return fail("Failed to update document.", { status: 500, code: ErrorCode.INTERNAL });
  }
}

/**
 * DELETE /api/documents/:id — soft delete (moves to Trash).
 * DELETE /api/documents/:id?permanent=true — permanent, irreversible delete.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  const { id } = await params;
  const permanent = new URL(req.url).searchParams.get("permanent") === "true";

  const done = permanent
    ? await permanentlyDeleteDocument(user.id, id)
    : await softDeleteDocument(user.id, id);

  if (!done) {
    return fail("Document not found.", { status: 404, code: ErrorCode.NOT_FOUND });
  }
  await logAudit({
    userId: user.id,
    action: permanent ? "document.purge" : "document.delete",
    entity: "document",
    entityId: id,
  });
  return ok(
    { id },
    permanent ? "Document permanently deleted." : "Document moved to Trash."
  );
}
