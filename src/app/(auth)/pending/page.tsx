import type { Metadata } from "next";
import { StatusScreen } from "@/components/landing/auth/status-screen";

export const metadata: Metadata = {
  title: "Pending approval",
  description: "Your BriefVault account is awaiting approval.",
};

export default function PendingApprovalPage() {
  return (
    <StatusScreen variant="pending" title="Registration successful">
      <p>Your account has been created successfully.</p>
      <p>
        Your selected subscription requires approval by the BriefVault team before access is
        granted.
      </p>
      <p>You&apos;ll receive an email once your account has been approved.</p>
    </StatusScreen>
  );
}
