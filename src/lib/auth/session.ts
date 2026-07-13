import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "bv_session";

const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 7);
const TTL_DAYS_REMEMBER = Number(process.env.SESSION_TTL_DAYS_REMEMBER ?? 30);

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sessionMaxAge(remember: boolean): number {
  const days = remember ? TTL_DAYS_REMEMBER : TTL_DAYS;
  return days * 24 * 60 * 60; // seconds
}

interface SessionMeta {
  remember?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** Create a DB-backed session and set the httpOnly session cookie. */
export async function createSession(userId: string, meta: SessionMeta = {}) {
  const remember = meta.remember ?? false;
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const maxAge = sessionMaxAge(remember);
  const expiresAt = new Date(Date.now() + maxAge * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return { token, expiresAt };
}

/** Resolve the current authenticated user from the session cookie. */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const { user } = session;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    organization: user.organization,
    orgType: user.orgType,
    designation: user.designation,
    country: user.country,
    emailVerified: user.emailVerified,
    role: user.role,
    status: user.status,
  };
}

/** Destroy the current session (DB row + cookie). */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
