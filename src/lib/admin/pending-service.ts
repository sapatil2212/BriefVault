import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertAccountTransition } from "@/lib/subscriptions/state-machine";
import { activateSubscription, cancelSubscription, createPendingSubscription } from "@/lib/subscriptions/service";
import { getPlanByKey } from "@/lib/plans/service";
import { createNotification } from "@/lib/notifications/service";
import {
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
  sendInfoRequestedEmail,
  sendSubscriptionActivatedEmail,
} from "@/lib/auth/account-mailer";
import type { UserStatus } from "@/types/user";
import type { Paginated } from "@/types/admin";
import type { PendingUserDetail, PendingUserRow } from "@/types/admin";

/** Best-effort user-agent → { device, browser } parser (no dependency). */
export function parseUserAgent(ua: string | null | undefined): { device: string; browser: string } {
  if (!ua) return { device: "Unknown", browser: "Unknown" };
  const device = /mobile|android|iphone|ipad/i.test(ua)
    ? /ipad|tablet/i.test(ua)
      ? "Tablet"
      : "Mobile"
    : "Desktop";
  let browser = "Unknown";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  return { device, browser };
}

export interface PendingListFilter {
  search?: string;
  plan?: string; // plan key
  page?: number;
  pageSize?: number;
  sort?: "createdAt" | "email";
  order?: "asc" | "desc";
}

function buildWhere(f: PendingListFilter): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = { status: "PENDING" };
  if (f.search) {
    where.OR = [
      { email: { contains: f.search } },
      { firstName: { contains: f.search } },
      { lastName: { contains: f.search } },
      { organization: { contains: f.search } },
      { phone: { contains: f.search } },
    ];
  }
  if (f.plan) {
    where.subscription = { plan: { key: f.plan.toUpperCase() } };
  }
  return where;
}

/** List users awaiting approval, with their requested plan. */
export async function listPendingUsers(f: PendingListFilter): Promise<Paginated<PendingUserRow>> {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, f.pageSize ?? 20));
  const where = buildWhere(f);
  const sort = f.sort ?? "createdAt";
  const order = f.order ?? "desc";

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        organization: true,
        country: true,
        emailVerified: true,
        status: true,
        createdAt: true,
        subscription: { select: { plan: { select: { key: true, name: true } } } },
      },
    }),
  ]);

  const items: PendingUserRow[] = rows.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    phone: u.phone,
    organization: u.organization,
    country: u.country ?? null,
    planKey: u.subscription?.plan.key ?? null,
    planName: u.subscription?.plan.name ?? "—",
    emailVerified: u.emailVerified,
    status: u.status as UserStatus,
    createdAt: u.createdAt.toISOString(),
  }));

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Full pending-user detail for the review panel. */
export async function getPendingUserDetail(id: string): Promise<PendingUserDetail | null> {
  const u = await prisma.user.findUnique({
    where: { id },
    include: {
      subscription: { include: { plan: true } },
      approvals: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!u) return null;

  const { device, browser } = parseUserAgent(u.signupUserAgent);

  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    organization: u.organization,
    orgType: u.orgType,
    designation: u.designation ?? null,
    country: u.country ?? null,
    status: u.status as UserStatus,
    emailVerified: u.emailVerified,
    verifiedAt: u.verifiedAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    signup: {
      ip: u.signupIp ?? null,
      device,
      browser,
      userAgent: u.signupUserAgent ?? null,
    },
    subscription: u.subscription
      ? {
          status: u.subscription.status,
          planKey: u.subscription.plan.key,
          planName: u.subscription.plan.name,
          priceMonthly: u.subscription.plan.priceMonthly,
          currency: u.subscription.plan.currency,
          currentPeriodEnd: u.subscription.currentPeriodEnd?.toISOString() ?? null,
        }
      : null,
    approvals: u.approvals.map((a) => ({
      id: a.id,
      decision: a.decision,
      remarks: a.remarks ?? null,
      approvedBy: a.approvedBy ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

async function loadUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { subscription: { include: { plan: true } } },
  });
  if (!user) throw new Error("User not found.");
  return user;
}

/**
 * Approve a pending (or suspended) account. Optionally assign a specific plan;
 * otherwise the plan chosen at signup is used. Activates the subscription and
 * notifies the user.
 */
export async function approveUser(id: string, adminId: string, planKey?: string) {
  const user = await loadUser(id);
  assertAccountTransition(user.status as UserStatus, "ACTIVE");

  // Resolve the plan to grant.
  const plan = planKey
    ? await getPlanByKey(planKey)
    : user.subscription?.plan ?? null;
  if (!plan) throw new Error("No plan to assign. Provide a plan.");

  await prisma.user.update({ where: { id }, data: { status: "ACTIVE" } });
  await activateSubscription(id, plan.id);
  await prisma.approval.create({
    data: { userId: id, requestedPlanKey: plan.key, decision: "APPROVED", approvedBy: adminId, approvedAt: new Date() },
  });

  await Promise.allSettled([
    sendAccountApprovedEmail(user.email, user.firstName, plan.name),
    sendSubscriptionActivatedEmail(user.email, user.firstName, plan.name),
    createNotification({
      userId: id,
      type: "SYSTEM",
      title: "Account approved",
      body: `Your ${plan.name} plan is now active. Welcome to BriefVault!`,
      link: "/dashboard",
    }),
  ]);

  return { id, plan: plan.key };
}

/** Reject a pending account with a reason. Cancels any pending subscription. */
export async function rejectUser(id: string, adminId: string, reason: string) {
  const user = await loadUser(id);
  assertAccountTransition(user.status as UserStatus, "REJECTED");

  await prisma.user.update({ where: { id }, data: { status: "REJECTED" } });
  await cancelSubscription(id);
  await prisma.approval.create({
    data: { userId: id, requestedPlanKey: user.subscription?.plan.key ?? "UNKNOWN", decision: "REJECTED", approvedBy: adminId, approvedAt: new Date(), remarks: reason },
  });
  // Revoke any active sessions.
  await prisma.session.deleteMany({ where: { userId: id } });

  await Promise.allSettled([
    sendAccountRejectedEmail(user.email, user.firstName, reason),
    createNotification({ userId: id, type: "SYSTEM", title: "Registration not approved", body: reason || undefined }),
  ]);

  return { id };
}

/** Ask the applicant for more information (keeps the account pending). */
export async function requestUserInfo(id: string, adminId: string, message: string) {
  const user = await loadUser(id);
  await prisma.approval.create({
    data: { userId: id, requestedPlanKey: user.subscription?.plan.key ?? "UNKNOWN", decision: "INFO_REQUESTED", approvedBy: adminId, remarks: message },
  });
  await Promise.allSettled([
    sendInfoRequestedEmail(user.email, user.firstName, message),
    createNotification({ userId: id, type: "SYSTEM", title: "More information requested", body: message }),
  ]);
  return { id };
}

/** Suspend an active account (revokes sessions). */
export async function suspendUser(id: string) {
  const user = await loadUser(id);
  assertAccountTransition(user.status as UserStatus, "SUSPENDED");
  await prisma.session.deleteMany({ where: { userId: id } });
  await prisma.user.update({ where: { id }, data: { status: "SUSPENDED" } });
  await createNotification({ userId: id, type: "SYSTEM", title: "Account suspended", body: "Your account access has been suspended. Contact support." }).catch(() => {});
  return { id };
}

/** Reactivate a suspended account. */
export async function reactivateUser(id: string) {
  const user = await loadUser(id);
  assertAccountTransition(user.status as UserStatus, "ACTIVE");
  await prisma.user.update({ where: { id }, data: { status: "ACTIVE" } });
  return { id };
}

/**
 * Change the plan assigned to a user. If the account is already active the new
 * plan is activated immediately; otherwise the pending subscription is updated.
 */
export async function changeUserPlan(id: string, planKey: string) {
  const user = await loadUser(id);
  const plan = await getPlanByKey(planKey);
  if (!plan) throw new Error("Unknown plan.");

  if (plan.requiresApproval) {
    await prisma.user.update({ where: { id }, data: { status: "PENDING" } });
    await createPendingSubscription(id, plan.id);
    await prisma.session.deleteMany({ where: { userId: id } }).catch(() => {});
    return { id, plan: plan.key, requiresApproval: true, redirectUrl: "/pending" };
  }

  if (user.status === "ACTIVE") {
    await activateSubscription(id, plan.id);
  } else {
    await createPendingSubscription(id, plan.id);
  }
  return { id, plan: plan.key, requiresApproval: false };
}
