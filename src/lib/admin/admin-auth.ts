import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Super Admin authentication — a platform-owner login that is INDEPENDENT of
 * the normal database user auth. Credentials live in environment variables:
 *
 *   SUPER_ADMIN_USERNAME, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_SECRET
 *
 * On success we issue a compact HMAC-signed session token (JWT-like, no extra
 * dependency) in an httpOnly cookie. `getEnvAdminSession()` verifies it and the
 * admin guard treats a valid holder as a SUPER_ADMIN. This gives the platform
 * owner a bootstrap login that works even with an empty user table.
 *
 * SECURITY NOTES:
 *  - Keep SUPER_ADMIN_SECRET long and random in production.
 *  - The provided sample password ("123") is for local dev only — use a strong
 *    password in any real environment.
 */

export const ADMIN_COOKIE = "bv_admin";

const TTL_SECONDS = Number(process.env.SUPER_ADMIN_TTL_SECONDS ?? 8 * 60 * 60); // 8h

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function getSecret(): string {
  const secret = process.env.SUPER_ADMIN_SECRET;
  if (!secret) throw new Error("SUPER_ADMIN_SECRET is not configured.");
  return secret;
}

interface AdminTokenPayload {
  sub: "super-admin";
  username: string;
  iat: number;
  exp: number;
}

function sign(dataB64: string): string {
  return createHmac("sha256", getSecret()).update(dataB64).digest("base64url");
}

/** Create a signed session token for the platform super admin. */
export function signAdminToken(username: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminTokenPayload = { sub: "super-admin", username, iat: now, exp: now + TTL_SECONDS };
  const data = b64url(JSON.stringify(payload));
  return `${data}.${sign(data)}`;
}

/** Verify a token's signature and expiry. Returns the payload or null. */
export function verifyAdminToken(token: string | undefined | null): AdminTokenPayload | null {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as AdminTokenPayload;
    if (payload.sub !== "super-admin") return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Constant-time credential check against the configured env values. */
export function validateAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.SUPER_ADMIN_USERNAME ?? "";
  const expectedPass = process.env.SUPER_ADMIN_PASSWORD ?? "";
  if (!expectedUser || !expectedPass) return false;

  const userOk = safeEqual(username.trim().toLowerCase(), expectedUser.trim().toLowerCase());
  const passOk = safeEqual(password, expectedPass);
  // Evaluate both to avoid short-circuit timing leaks.
  return userOk && passOk;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** The synthetic user the guard returns for an env-based super admin. */
export interface EnvAdminUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  orgType: string;
  emailVerified: boolean;
  role: "SUPER_ADMIN";
  status: "ACTIVE";
  isEnvAdmin: true;
}

function toEnvAdminUser(username: string): EnvAdminUser {
  return {
    id: "env-super-admin",
    firstName: "Super",
    lastName: "Admin",
    phone: "",
    email: username,
    organization: "BriefVault Platform",
    orgType: "OTHER",
    emailVerified: true,
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    isEnvAdmin: true,
  };
}

/** Resolve the current env-based super-admin session from the cookie. */
export async function getEnvAdminSession(): Promise<EnvAdminUser | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const payload = verifyAdminToken(token);
  if (!payload) return null;
  return toEnvAdminUser(payload.username);
}

/** Set the super-admin session cookie after a successful login. */
export async function setAdminSessionCookie(username: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, signAdminToken(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

/** Clear the super-admin session cookie. */
export async function clearAdminSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
