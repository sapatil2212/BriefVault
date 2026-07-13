import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/validations/auth";
import { registerPendingUser } from "@/lib/auth/service";
import { rateLimit, getClientIp } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`signup:${ip}`, 8, 60 * 15);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form and try again.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const result = await registerPendingUser(parsed.data, {
      ip,
      userAgent: req.headers.get("user-agent"),
    });
    if (!result.ok) {
      const status = result.code === "INVALID_PLAN" ? 422 : 409;
      return NextResponse.json({ error: result.message }, { status });
    }
    return NextResponse.json(
      {
        message: "Verification code sent.",
        email: result.email,
        delivered: result.delivered,
        plan: result.plan,
        requiresApproval: result.requiresApproval,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[signup] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
