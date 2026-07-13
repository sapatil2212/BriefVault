import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { fail, ErrorCode } from "@/lib/api/response";
import { getStorageProvider, storageConfig, ObjectNotFoundError } from "@/lib/storage";

export const runtime = "nodejs";

/** Infer a browser-friendly content type from the file extension. */
function contentTypeFor(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    txt: "text/plain; charset=utf-8",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    tif: "image/tiff",
    tiff: "image/tiff",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * GET /api/storage/:key
 * Authenticated download for filesystem-backed objects.
 *
 * Authorization: object keys are namespaced `{project}/{userId}/...`, so a user
 * may only read their own objects. Cloud providers would instead return signed
 * URLs and bypass this route.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  const { key: segments } = await params;
  const key = segments.map(decodeURIComponent).join("/");

  // Enforce ownership from the key namespace before touching storage.
  const expectedPrefix = `${storageConfig.project}/${user.id}/`;
  if (!key.startsWith(expectedPrefix)) {
    return fail("Forbidden.", { status: 403, code: "FORBIDDEN" });
  }

  try {
    const data = await getStorageProvider().get(key);
    const fileName = key.split("/").pop() ?? "download";
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentTypeFor(fileName),
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      return fail("File not found.", { status: 404, code: ErrorCode.NOT_FOUND });
    }
    console.error("[api/storage] error:", err);
    return fail("Failed to read file.", { status: 500, code: ErrorCode.INTERNAL });
  }
}
