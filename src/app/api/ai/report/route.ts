import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { reportSchema } from "@/lib/validations/ai";
import { createReport } from "@/lib/ai/services/report-service";

export const runtime = "nodejs";

/** POST /api/ai/report — generate and store a report for an owned document. */
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
    const { documentId, type } = reportSchema.parse(body);
    const report = await createReport(user.id, documentId, type);
    if (!report) {
      return fail("Document not found.", { status: 404, code: ErrorCode.NOT_FOUND });
    }
    return ok({ id: report.id, title: report.title, type: report.type }, "Report generated.", {
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
    const message = err instanceof Error ? err.message : "Failed to generate report.";
    if (message.includes("not been processed")) {
      return fail("Document must be processed before generating a report.", {
        status: 409,
        code: "NOT_PROCESSED",
      });
    }
    console.error("[ai/report] error:", err);
    return fail("Failed to generate report.", { status: 500, code: ErrorCode.INTERNAL });
  }
}
