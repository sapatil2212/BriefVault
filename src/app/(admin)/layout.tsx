import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin Console · BriefVault",
  description: "Platform operations center.",
};

/**
 * Super Admin route group. Server-guarded: only ADMIN / SUPER_ADMIN reach the
 * console (see `requireAdminPage`). Every `/api/admin/*` route re-checks
 * independently, so this is defense-in-depth, not the sole gate.
 */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdminPage();

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

  return <AdminShell user={sessionUser}>{children}</AdminShell>;
}
