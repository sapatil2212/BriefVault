import { NextRequest, NextResponse } from "next/server";
import { resendOtpSchema } from "@/lib/validations/auth";
import { resendOtp } from "@/lib/auth/service";
import { rateLimit, getClientIp } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = resendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 422 });
  }

  // Throttle resends per email + IP (max 3 per 5 minutes).
  const limit = rateLimit(`resend:${parsed.data.email}:${ip}`, 3, 60 * 5);
  if (!limit.success) {
    return NextResponse.json(
      { error: `Please wait ${limit.retryAfterSeconds}s before requesting another code.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const result = await resendOtp(parsed.data.email);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 410 });
    }
    return NextResponse.json(
      { message: "A new code is on its way.", delivered: result.delivered },
      { status: 200 }
    );
  } catch (err) {
    console.error("[resend-otp] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
