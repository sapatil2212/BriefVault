import { createHash, randomInt } from "crypto";

export const OTP_LENGTH = 6;

export const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES ?? 5);
export const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);

/** Generate a cryptographically-random numeric OTP. */
export function generateOtp(): string {
  const max = 10 ** OTP_LENGTH;
  return randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

/** Hash an OTP for storage. OTPs are short-lived and rate-limited, so a fast
 *  SHA-256 with a server pepper is appropriate and constant-time comparable. */
export function hashOtp(code: string): string {
  return createHash("sha256")
    .update(`${code}:${process.env.DATABASE_URL ?? "briefvault"}`)
    .digest("hex");
}

export function otpExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

/** Constant-time comparison of two hex digests. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
