import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { listFolders, createFolder } from "@/lib/folders/service";
import { createFolderSchema } from "@/lib/validations/folder";

export const runtime = "nodejs";

/** GET /api/folders — the caller's folders with document counts. */
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", { status: 401, code: ErrorCode.UNAUTHORIZED });
  }
  const items = await listFolders(user.id);
  return ok(items, "OK");
}

/** POST /api/folders — create a folder. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", { status: 401, code: ErrorCode.UNAUTHORIZED });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  try {
    const input = createFolderSchema.parse(body);
    const folder = await createFolder(user.id, input);
    return ok(folder, "Folder created.", { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Please check your input.", {
        status: 422,
        code: ErrorCode.VALIDATION,
        error: err.issues.map((i) => i.message).join("; "),
      });
    }
    console.error("[folders POST] error:", err);
    return fail("Failed to create folder.", { status: 500, code: ErrorCode.INTERNAL });
  }
}
