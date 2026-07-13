import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { reactivateUserSubscription } from "@/lib/subscriptions/service";
import type { AdminUserRow, AdminUserDetail, Paginated } from "@/types/admin";

/** Filters accepted by the admin user list. All optional; combine with AND. */
export interface UserListFilter {
  search?: string;
  role?: string;
  status?: string;
  organization?: string;
  orgType?: string;
  page?: number;
  pageSize?: number;
  sort?: "createdAt" | "lastLoginAt" | "email";
  order?: "asc" | "desc";
}

function buildWhere(f: UserListFilter): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (f.search) {
    where.OR = [
      { email: { contains: f.search } },
      { firstName: { contains: f.search } },
      { lastName: { contains: f.search } },
      { organization: { contains: f.search } },
    ];
  }
  if (f.role) where.role = f.role as Prisma.UserWhereInput["role"];
  if (f.status) where.status = f.status as Prisma.UserWhereInput["status"];
  if (f.organization) where.organization = f.organization;
  if (f.orgType) where.orgType = f.orgType as Prisma.UserWhereInput["orgType"];
  return where;
}

export async function listUsers(f: UserListFilter): Promise<Paginated<AdminUserRow>> {
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
        orgType: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { documents: true, sessions: true } },
      },
    }),
  ]);

  const items: AdminUserRow[] = rows.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    organization: u.organization,
    orgType: u.orgType,
    role: u.role,
    status: u.status,
    emailVerified: u.emailVerified,
    documentCount: u._count.documents,
    sessionCount: u._count.sessions,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function setUserStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
  // Suspending a user immediately revokes all their sessions.
  if (status === "SUSPENDED") {
    await prisma.session.deleteMany({ where: { userId: id } });
  }
  const updated = await prisma.user.update({ where: { id }, data: { status } });
  // Activating the account must also (re)activate its subscription, otherwise
  // the signin route still blocks login with "subscription is not active".
  if (status === "ACTIVE") {
    await reactivateUserSubscription(id);
  }
  return updated;
}

/** Terminate every active session for a user (force logout). Returns count. */
export async function forceLogout(id: string): Promise<number> {
  const { count } = await prisma.session.deleteMany({ where: { userId: id } });
  return count;
}

/** Set a new password and force re-authentication by clearing sessions. */
export async function resetUserPassword(id: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);
}

export async function deleteUser(id: string) {
  // Cascades to sessions, documents, folders, notifications via schema relations.
  return prisma.user.delete({ where: { id } });
}

/**
 * Admin edit of a user's profile fields (and optionally status). Distinct from
 * `setUserStatus` (used by the quick suspend/activate menu action) — this
 * powers the "Edit user" dialog, which can update several fields at once.
 */
export async function updateUserProfile(
  id: string,
  data: {
    firstName: string;
    lastName: string;
    phone: string;
    organization: string;
    orgType: string;
    status?: "ACTIVE" | "SUSPENDED";
  }
) {
  // Suspending via the edit form should also revoke sessions, same as the
  // dedicated suspend action.
  if (data.status === "SUSPENDED") {
    await prisma.session.deleteMany({ where: { userId: id } });
  }
  const updated = await prisma.user.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      organization: data.organization,
      orgType: data.orgType as Prisma.UserUpdateInput["orgType"],
      ...(data.status ? { status: data.status } : {}),
    },
  });
  // Keep the login-gating subscription in sync when activating via the editor.
  if (data.status === "ACTIVE") {
    await reactivateUserSubscription(id);
  }
  return updated;
}

export async function getUserDetail(id: string): Promise<AdminUserDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      organization: true,
      orgType: true,
      role: true,
      status: true,
      emailVerified: true,
      verifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true },
      },
      _count: { select: { documents: true, folders: true, notifications: true } },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    organization: user.organization,
    orgType: user.orgType,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    verifiedAt: user.verifiedAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    sessions: user.sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    })),
    counts: user._count,
  };
}
