import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { statusRedirectPath } from "@/lib/subscriptions/state-machine";
import type { UserStatus } from "@/types/user";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your legal intelligence workspace.",
};

/**
 * Authenticated app shell. Guards every dashboard route server-side and
 * delegates chrome (collapsible sidebar, top bar, providers) to DashboardShell.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  // Enforce the approval workflow at the app shell: non-active accounts are
  // routed to their status screen and never reach the dashboard.
  const statusPath = statusRedirectPath(user.status as UserStatus);
  if (statusPath) redirect(statusPath);

  const sessionUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    organization: user.organization,
    orgType: user.orgType,
    role: user.role,
    status: user.status,
  };

  return <DashboardShell user={sessionUser}>{children}</DashboardShell>;
}
