import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { orgTypeToLabel } from "@/lib/auth/profile";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { PasswordForm } from "@/components/dashboard/password-form";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-[13px] text-muted-foreground">
          Manage your profile and account details.
        </p>
      </div>

      <div className="space-y-2.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Profile Information
        </h2>
        <ProfileForm
          initial={{
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            email: user.email,
            organization: user.organization,
            orgType: orgTypeToLabel(user.orgType),
            designation: user.designation ?? "",
            country: user.country ?? "",
          }}
        />
      </div>

      <div className="space-y-2.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Security & Password
        </h2>
        <PasswordForm />
      </div>
    </div>
  );
}
