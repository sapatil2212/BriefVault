import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { compareSchema } from "@/lib/validations/ai";
import { compareDocuments } from "@/lib/ai/services/compare-service";
import { checkFeatureAllowed } from "@/lib/subscriptions/service";

export const runtime = "nodejs";

/** POST /api/ai/compare — diff two owned documents (added/removed/modified). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  // Enforce comparison feature flag (Professional+ only)
  const featureCheck = await checkFeatureAllowed(user.id, "COMPARISON");
  if (!featureCheck.allowed) {
    return fail(featureCheck.message ?? "Document comparison is not available on your plan.", {
      status: 402,
      code: "FEATURE_GATED",
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  try {
    const { documentAId, documentBId } = compareSchema.parse(body);
    const res = await compareDocuments(user.id, documentAId, documentBId);

    if ("error" in res) {
      if (res.error === "NOT_FOUND") {
        return fail("One or both documents were not found.", {
          status: 404,
          code: ErrorCode.NOT_FOUND,
        });
      }
      return fail("Both documents must be processed before comparing.", {
        status: 409,
        code: "NO_TEXT",
      });
    }

    return ok(res, "OK");
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Please check your input.", {
        status: 422,
        code: ErrorCode.VALIDATION,
        error: err.issues.map((i) => i.message).join("; "),
      });
    }
    console.error("[ai/compare] error:", err);
    return fail("Failed to compare documents.", {
      status: 500,
      code: ErrorCode.INTERNAL,
    });
  }
}
