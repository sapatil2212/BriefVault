import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { updateProfile } from "@/lib/auth/profile";
import { profileUpdateSchema } from "@/lib/validations/auth";
import { ok, fail, ErrorCode } from "@/lib/api/response";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user }, { status: 200 });
}

/** PATCH /api/auth/me — update the signed-in user's profile. */
export async function PATCH(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) {
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
    const input = profileUpdateSchema.parse(body);
    const user = await updateProfile(current.id, input);
    return ok(user, "Profile updated.");
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Please check your details.", {
        status: 422,
        code: ErrorCode.VALIDATION,
        error: err.issues.map((i) => i.message).join("; "),
      });
    }
    console.error("[auth/me PATCH] error:", err);
    return fail("Failed to update profile.", { status: 500, code: ErrorCode.INTERNAL });
  }
}
