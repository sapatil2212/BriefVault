import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  generateOtp,
  hashOtp,
  otpExpiry,
  safeEqual,
  OTP_MAX_ATTEMPTS,
} from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/auth/mailer";
import { purgeExpiredUnverified } from "@/lib/auth/cleanup";
import {
  ORG_TYPE_ENUM,
  type OrgTypeLabel,
  type SignupInput,
} from "@/lib/validations/auth";
import type { OrgType } from "@prisma/client";
import { getPlanByKey } from "@/lib/plans/service";
import {
  activateSubscription,
  createPendingSubscription,
} from "@/lib/subscriptions/service";
import { createNotification } from "@/lib/notifications/service";
import {
  notifySuperAdminNewRegistration,
  sendAccountApprovedEmail,
  sendPendingApprovalEmail,
  sendSubscriptionActivatedEmail,
} from "@/lib/auth/account-mailer";

export { purgeExpiredUnverified, purgeExpiredSessions } from "@/lib/auth/cleanup";

async function issueOtp(userId: string, email: string, name: string) {
  // Invalidate any previous OTPs for this user.
  await prisma.verificationOtp.deleteMany({ where: { userId } });

  const code = generateOtp();
  await prisma.verificationOtp.create({
    data: { userId, codeHash: hashOtp(code), expiresAt: otpExpiry() },
  });

  const { delivered } = await sendOtpEmail(email, code, name);
  return { delivered };
}

export interface SignupMeta {
  ip?: string | null;
  userAgent?: string | null;
}

export type SignupResult =
  | { ok: true; email: string; delivered: boolean; plan: string; requiresApproval: boolean }
  | { ok: false; code: "EMAIL_TAKEN" | "INVALID_PLAN"; message: string };

export async function registerPendingUser(
  input: SignupInput,
  meta: SignupMeta = {}
): Promise<SignupResult> {
  await purgeExpiredUnverified();

  const plan = await getPlanByKey(input.plan);
  if (!plan || !plan.isActive) {
    return { ok: false, code: "INVALID_PLAN", message: "The selected plan is unavailable." };
  }

  const orgType = ORG_TYPE_ENUM[input.orgType as OrgTypeLabel] as OrgType;
  const passwordHash = await hashPassword(input.password);

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing?.emailVerified) {
    return {
      ok: false,
      code: "EMAIL_TAKEN",
      message: "An account with this email already exists. Please sign in.",
    };
  }

  // Every new signup starts PENDING; free plans are promoted to ACTIVE on
  // email verification, paid plans stay PENDING until an admin approves.
  const baseData = {
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    organization: input.organization,
    orgType,
    designation: input.designation,
    country: input.country,
    passwordHash,
    status: "PENDING" as const,
    signupIp: meta.ip ?? null,
    signupUserAgent: meta.userAgent ?? null,
  };

  let userId: string;
  if (existing) {
    // Unverified re-signup: refresh details and reset the verification window.
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { ...baseData, createdAt: new Date() },
    });
    userId = updated.id;
  } else {
    const created = await prisma.user.create({
      data: { ...baseData, email: input.email },
    });
    userId = created.id;
  }

  // Record the chosen plan as a pending subscription so it surfaces in the
  // admin pending-users view even before verification/approval.
  await createPendingSubscription(userId, plan.id);

  // For paid plans, open an approval record so the workflow has a history.
  if (plan.requiresApproval) {
    await prisma.approval.create({
      data: { userId, requestedPlanKey: plan.key, decision: "PENDING" },
    });
  }

  const { delivered } = await issueOtp(userId, input.email, input.firstName);
  return {
    ok: true,
    email: input.email,
    delivered,
    plan: plan.key,
    requiresApproval: plan.requiresApproval,
  };
}

export type VerifyResult =
  | { ok: true; userId: string; requiresApproval: boolean; planKey: string | null }
  | {
      ok: false;
      code: "NO_PENDING" | "EXPIRED" | "INVALID" | "TOO_MANY";
      message: string;
      remainingAttempts?: number;
    };

export async function verifyOtp(
  email: string,
  code: string
): Promise<VerifyResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.emailVerified) {
    return {
      ok: false,
      code: "NO_PENDING",
      message: "No pending verification found. Please sign up again.",
    };
  }

  const otp = await prisma.verificationOtp.findFirst({
    where: { userId: user.id, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return {
      ok: false,
      code: "NO_PENDING",
      message: "No active code. Please request a new one.",
    };
  }

  if (otp.expiresAt < new Date()) {
    return {
      ok: false,
      code: "EXPIRED",
      message: "This code has expired. Please request a new one.",
    };
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.verificationOtp.delete({ where: { id: otp.id } });
    return {
      ok: false,
      code: "TOO_MANY",
      message: "Too many incorrect attempts. Please request a new code.",
    };
  }

  const matches = safeEqual(hashOtp(code), otp.codeHash);
  if (!matches) {
    const updated = await prisma.verificationOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    const remainingAttempts = Math.max(0, OTP_MAX_ATTEMPTS - updated.attempts);
    return {
      ok: false,
      code: "INVALID",
      message: `Incorrect code. ${remainingAttempts} attempt${
        remainingAttempts === 1 ? "" : "s"
      } left.`,
      remainingAttempts,
    };
  }

  // Success — verify the user and consume all their OTPs.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verifiedAt: new Date() },
    }),
    prisma.verificationOtp.deleteMany({ where: { userId: user.id } }),
  ]);

  // Resolve the plan chosen at signup to branch the onboarding flow.
  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    include: { plan: true },
  });
  const plan = subscription?.plan ?? null;
  const requiresApproval = plan?.requiresApproval ?? false;
  const name = user.firstName;

  if (plan && !requiresApproval) {
    // Free plan: activate immediately after verification — no admin gate.
    await prisma.user.update({ where: { id: user.id }, data: { status: "ACTIVE" } });
    await activateSubscription(user.id, plan.id);
    await Promise.allSettled([
      sendAccountApprovedEmail(user.email, name, plan.name),
      sendSubscriptionActivatedEmail(user.email, name, plan.name),
      createNotification({
        userId: user.id,
        type: "SYSTEM",
        title: "Welcome to BriefVault",
        body: `Your ${plan.name} plan is active. Start by uploading a document.`,
        link: "/dashboard",
      }),
    ]);
  } else if (plan) {
    // Paid plan: hold at PENDING and alert the platform team for approval.
    await Promise.allSettled([
      sendPendingApprovalEmail(user.email, name, plan.name),
      notifySuperAdminNewRegistration(`${user.firstName} ${user.lastName}`, user.email, plan.name, user.organization),
    ]);
  }

  return { ok: true, userId: user.id, requiresApproval, planKey: plan?.key ?? null };
}

export type ResendResult =
  | { ok: true; delivered: boolean }
  | { ok: false; code: "NO_PENDING"; message: string };

export async function resendOtp(email: string): Promise<ResendResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) {
    return {
      ok: false,
      code: "NO_PENDING",
      message: "No pending verification found. Please sign up again.",
    };
  }
  const { delivered } = await issueOtp(user.id, user.email, user.firstName);
  return { ok: true, delivered };
}
