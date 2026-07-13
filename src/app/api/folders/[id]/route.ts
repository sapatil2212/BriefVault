import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { renameFolder, deleteFolder } from "@/lib/folders/service";
import { updateFolderSchema } from "@/lib/validations/folder";

export const runtime = "nodejs";

/** PATCH /api/folders/:id — rename / recolor a folder. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", { status: 401, code: ErrorCode.UNAUTHORIZED });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  try {
    const input = updateFolderSchema.parse(body);
    const done = await renameFolder(user.id, id, input);
    if (!done) {
      return fail("Folder not found.", { status: 404, code: ErrorCode.NOT_FOUND });
    }
    return ok({ id }, "Folder updated.");
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Please check your input.", {
        status: 422,
        code: ErrorCode.VALIDATION,
        error: err.issues.map((i) => i.message).join("; "),
      });
    }
    console.error("[folders PATCH] error:", err);
    return fail("Failed to update folder.", { status: 500, code: ErrorCode.INTERNAL });
  }
}

/** DELETE /api/folders/:id — delete a folder (documents are detached, not deleted). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", { status: 401, code: ErrorCode.UNAUTHORIZED });
  }
  const { id } = await params;
  const done = await deleteFolder(user.id, id);
  if (!done) {
    return fail("Folder not found.", { status: 404, code: ErrorCode.NOT_FOUND });
  }
  return ok({ id }, "Folder deleted.");
}
