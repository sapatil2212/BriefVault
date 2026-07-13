import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getExtractedInsights } from "@/lib/ai/services/document-service";
import { InsightsExplorer } from "@/components/dashboard/insights-explorer";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Saved Insights",
};

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const insights = await getExtractedInsights(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Saved Insights</h1>
        <p className="text-[13px] text-muted-foreground">
          Every AI-extracted insight across your documents, in one place.
        </p>
      </div>
      <InsightsExplorer
        insights={insights.map((i) => ({ ...i, updatedAt: i.updatedAt.toISOString() }))}
      />
    </div>
  );
}
