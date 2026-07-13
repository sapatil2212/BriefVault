import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ReportsManager } from "@/components/reports/reports-manager";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Reports</h1>
        <p className="text-[13px] text-muted-foreground">
          Generate client-ready reports and legal opinions from your documents.
        </p>
      </div>
      <ReportsManager />
    </div>
  );
}
