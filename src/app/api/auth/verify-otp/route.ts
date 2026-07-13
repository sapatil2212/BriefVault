import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSchema } from "@/lib/validations/auth";
import { verifyOtp } from "@/lib/auth/service";
import { rateLimit, getClientIp } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`verify:${ip}`, 20, 60 * 15);
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

  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 422 });
  }

  try {
    const result = await verifyOtp(parsed.data.email, parsed.data.code);
    if (!result.ok) {
      const status = result.code === "INVALID" ? 401 : 410;
      return NextResponse.json(
        { error: result.message, code: result.code, remainingAttempts: result.remainingAttempts },
        { status }
      );
    }

    // Email is verified, but we intentionally do NOT create a session here.
    // Free-plan users are sent to sign in; paid-plan users go to the pending
    // approval screen. The client branches on `requiresApproval`.
    return NextResponse.json(
      {
        message: result.requiresApproval
          ? "Email verified. Your account is awaiting approval."
          : "Email verified. Please sign in.",
        requiresApproval: result.requiresApproval,
        plan: result.planKey,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[verify-otp] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
