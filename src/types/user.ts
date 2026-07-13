/** Account type, mirrors the Prisma `UserRole` enum. */
export type UserRole = "USER" | "SUPER_ADMIN";

/** Account lifecycle state, mirrors the Prisma `UserStatus` enum. */
export type UserStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";

/** Subscription lifecycle, mirrors the Prisma `SubscriptionStatus` enum. */
export type SubscriptionStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";

/** The authenticated user shape passed from server to client dashboard chrome. */
export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  orgType: string;
  role?: UserRole;
  status?: UserStatus;
}
