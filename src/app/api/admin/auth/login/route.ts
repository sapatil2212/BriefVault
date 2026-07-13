import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { validateAdminCredentials, setAdminSessionCookie } from "@/lib/admin/admin-auth";
import { logAudit } from "@/lib/audit/service";
import { rateLimit, getClientIp } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  username: z.string().min(1, "Username is required.").max(200),
  password: z.string().min(1, "Password is required.").max(200),
});

/**
 * POST /api/admin/auth/login
 * Authenticates the platform super admin against the SUPER_ADMIN_* env vars and
 * issues an httpOnly signed session cookie. Rate-limited per IP to slow
 * brute-force attempts.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`admin-login:${ip}`, 8, 5 * 60); // 8 tries / 5 min
  if (!limit.success) {
    return fail("Too many attempts. Please try again later.", {
      status: 429,
      code: ErrorCode.RATE_LIMIT,
    });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail("Invalid request.", { status: 422, code: ErrorCode.VALIDATION });
  }

  const { username, password } = parsed.data;

  if (!validateAdminCredentials(username, password)) {
    // Audit failed attempts for the security center.
    await logAudit({
      userId: "env-super-admin",
      action: "admin.login.failed",
      entity: "AdminSession",
      metadata: { username, ipAddress: ip, userAgent: req.headers.get("user-agent") },
    });
    return fail("Invalid credentials.", { status: 401, code: ErrorCode.UNAUTHORIZED });
  }

  await setAdminSessionCookie(username);
  await logAudit({
    userId: "env-super-admin",
    action: "admin.login.success",
    entity: "AdminSession",
    metadata: { username, ipAddress: ip, userAgent: req.headers.get("user-agent") },
  });

  return ok({ username }, "Signed in as super admin.");
}
