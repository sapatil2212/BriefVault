import type { Metadata } from "next";
import { StatusScreen } from "@/components/landing/auth/status-screen";

export const metadata: Metadata = {
  title: "Account suspended",
  description: "Your BriefVault account has been suspended.",
};

export default function SuspendedPage() {
  return (
    <StatusScreen variant="suspended" title="Account suspended">
      <p>Your BriefVault account has been suspended and access is currently disabled.</p>
      <p>Please contact your administrator or our support team to restore access.</p>
    </StatusScreen>
  );
}
