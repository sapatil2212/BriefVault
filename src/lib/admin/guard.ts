import "server-only";
import { redirect } from "next/navigation";
import { getEnvAdminSession, type EnvAdminUser } from "@/lib/admin/admin-auth";
import { fail, ErrorCode } from "@/lib/api/response";
import type { NextResponse } from "next/server";

export const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * Access control for the Super Admin operations console.
 *
 * The platform has exactly two account types: normal portal users (never admins)
 * and the single platform SUPER_ADMIN, who authenticates via the dedicated
 * env-based admin login (see `lib/admin/admin-auth.ts`). So the only thing that
 * grants console access is a valid env super-admin session — no database role
 * check is involved.
 *
 * Two entry points:
 *  - `requireAdminPage()` for server components / layouts — redirects.
 *  - `requireAdmin()` for route handlers — returns a typed guard result.
 */

/** The admin identity is always the env-based super admin. */
export type AdminUser = EnvAdminUser;

/** The lone super admin is, by definition, a super admin. */
export function isSuperAdmin(_user: AdminUser | null): boolean {
  return true;
}

/**
 * Server-component / layout guard. Grants access only to a valid env-based
 * super-admin session; otherwise redirects to the dedicated admin login.
 */
export async function requireAdminPage(): Promise<AdminUser> {
  const envAdmin = await getEnvAdminSession();
  if (envAdmin) return envAdmin;
  redirect(ADMIN_LOGIN_PATH);
}

export type AdminGuardResult =
  | { ok: true; user: AdminUser }
  | { ok: false; response: NextResponse };

/**
 * Route-handler guard. Never throws — returns a discriminated result so the
 * handler stays a pure function of the request. `opts.superAdmin` is accepted
 * for call-site clarity; the env admin always satisfies it.
 */
export async function requireAdmin(_opts?: { superAdmin?: boolean }): Promise<AdminGuardResult> {
  const envAdmin = await getEnvAdminSession();
  if (!envAdmin) {
    return {
      ok: false,
      response: fail("Super administrator access required.", {
        status: 401,
        code: ErrorCode.UNAUTHORIZED,
      }),
    };
  }
  return { ok: true, user: envAdmin };
}
