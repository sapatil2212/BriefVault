import { NextRequest, NextResponse } from "next/server";
import { signinSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
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

  const parsed = signinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details." }, { status: 422 });
  }

  const { email, password, remember } = parsed.data;

  // Throttle by email + IP to slow brute force.
  const limit = rateLimit(`signin:${email}:${ip}`, 10, 60 * 15);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Constant-ish response to avoid user enumeration.
    const valid = user ? await verifyPassword(password, user.passwordHash) : false;

    if (!user || !valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before signing in.", code: "UNVERIFIED", email: user.email },
        { status: 403 }
      );
    }

    // Account lifecycle gating (approval workflow). Only ACTIVE accounts may
    // sign in; every other state maps to a dedicated status screen.
    if (user.status === "PENDING") {
      return NextResponse.json(
        { error: "Your account is awaiting approval by the BriefVault team.", code: "PENDING" },
        { status: 403 }
      );
    }
    if (user.status === "REJECTED") {
      return NextResponse.json(
        { error: "Your registration was not approved. Contact support for details.", code: "REJECTED" },
        { status: 403 }
      );
    }
    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "This account has been suspended. Contact your administrator.", code: "SUSPENDED" },
        { status: 403 }
      );
    }

    // Subscription must be active (free plan is activated on verification;
    // paid plans on approval). Legacy accounts without a subscription pass.
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (subscription && subscription.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Your subscription is not active. Contact support.", code: "SUBSCRIPTION_INACTIVE" },
        { status: 403 }
      );
    }

    await createSession(user.id, {
      remember: Boolean(remember),
      ipAddress: ip,
      userAgent: req.headers.get("user-agent"),
    });

    // Record last successful sign-in for admin visibility (best-effort).
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

    return NextResponse.json({ message: "Signed in." }, { status: 200 });
  } catch (err) {
    console.error("[signin] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
