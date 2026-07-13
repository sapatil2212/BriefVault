import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEnvAdminSession } from "@/lib/admin/admin-auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Super Admin Login · BriefVault",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dedicated super-admin login. Lives in the `(admin-auth)` route group so it is
 * NOT wrapped by the guarded admin console layout. If the visitor is already an
 * admin (DB role or env session), skip straight to the console.
 */
export default async function AdminLoginPage() {
  // Already signed in as the super admin? Skip straight to the console.
  const envAdmin = await getEnvAdminSession();
  if (envAdmin) redirect("/admin");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0f1d] px-4">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      </div>
      <AdminLoginForm />
    </main>
  );
}
