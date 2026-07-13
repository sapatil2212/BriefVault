import type { Metadata } from "next";
import { AuthShell } from "@/components/landing/auth/auth-shell";
import { SignupForm } from "@/components/landing/auth/signup-form";
import { getPublicPlans } from "@/lib/plans/service";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Create your BriefVault account and start analyzing legal documents with AI.",
};

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const plans = await getPublicPlans();

  return (
    <AuthShell
      quote={{
        text: "The moment a new circular drops, we upload it and know the impact within minutes. The citations earned our trust.",
        name: "Vikram Mehta",
        role: "Senior CA, Mehta & Co.",
      }}
    >
      <SignupForm plans={plans} />
    </AuthShell>
  );
}
