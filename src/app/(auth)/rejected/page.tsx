import type { Metadata } from "next";
import { StatusScreen } from "@/components/landing/auth/status-screen";

export const metadata: Metadata = {
  title: "Registration not approved",
  description: "Your BriefVault registration could not be approved.",
};

export default function RejectedPage() {
  return (
    <StatusScreen variant="rejected" title="Registration not approved">
      <p>We&apos;re sorry — your BriefVault registration could not be approved at this time.</p>
      <p>
        If you believe this was a mistake or would like more information, please reach out to our
        support team.
      </p>
    </StatusScreen>
  );
}
