import type { SubscriptionStatus, UserStatus } from "@/types/user";

/**
 * Configurable state machines for the account approval workflow and the
 * subscription lifecycle. Transitions are declared as data (not hardcoded
 * `if` branches) so new states or rules — payment verification, KYC holds,
 * auto-approval — slot in by editing these maps rather than the call sites.
 */

/** Allowed account status transitions. */
export const ACCOUNT_TRANSITIONS: Record<UserStatus, UserStatus[]> = {
  PENDING: ["ACTIVE", "REJECTED"],
  ACTIVE: ["SUSPENDED"],
  SUSPENDED: ["ACTIVE", "REJECTED"],
  REJECTED: ["PENDING"], // allow re-opening a rejected application
};

/** Allowed subscription status transitions. */
export const SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  PENDING: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["EXPIRED", "CANCELLED"],
  EXPIRED: ["ACTIVE", "CANCELLED"],
  CANCELLED: ["ACTIVE"],
};

export function canTransitionAccount(from: UserStatus, to: UserStatus): boolean {
  if (from === to) return true;
  return ACCOUNT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionSubscription(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  if (from === to) return true;
  return SUBSCRIPTION_TRANSITIONS[from]?.includes(to) ?? false;
}

export class StateTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Illegal transition: ${from} → ${to}`);
    this.name = "StateTransitionError";
  }
}

export function assertAccountTransition(from: UserStatus, to: UserStatus): void {
  if (!canTransitionAccount(from, to)) throw new StateTransitionError(from, to);
}

/** Only ACTIVE accounts may access the dashboard/API. */
export function canAccessApp(status: UserStatus): boolean {
  return status === "ACTIVE";
}

/** Which post-login screen a non-active account should be routed to. */
export function statusRedirectPath(status: UserStatus): string | null {
  switch (status) {
    case "PENDING":
      return "/pending";
    case "REJECTED":
      return "/rejected";
    case "SUSPENDED":
      return "/suspended";
    default:
      return null;
  }
}
