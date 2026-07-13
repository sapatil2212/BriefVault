import type { Metadata } from "next";
import { AuthShell } from "@/components/landing/auth/auth-shell";
import { SigninForm } from "@/components/landing/auth/signin-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your BriefVault account.",
};

export default function SignInPage() {
  return (
    <AuthShell
      quote={{
        text: "BriefVault turned a 400-page award into a one-page brief I could take straight into a client call.",
        name: "Ananya Rao",
        role: "Partner, Rao & Associates",
      }}
    >
      <SigninForm />
    </AuthShell>
  );
}
