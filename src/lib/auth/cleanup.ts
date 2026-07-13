import { prisma } from "@/lib/prisma";

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES ?? 5);

/**
 * Remove unverified users whose verification window has elapsed.
 * Cascades to their OTPs and sessions. Prisma-only (no mailer/crypto) so it
 * stays safe to import from the instrumentation graph.
 */
export async function purgeExpiredUnverified(): Promise<number> {
  const cutoff = new Date(Date.now() - OTP_TTL_MINUTES * 60 * 1000);
  const { count } = await prisma.user.deleteMany({
    where: { emailVerified: false, createdAt: { lt: cutoff } },
  });
  return count;
}

export async function purgeExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
