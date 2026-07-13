import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCaseLawData } from "@/lib/ai/services/document-service";
import { CaseLawExplorer } from "@/components/dashboard/case-law-explorer";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Case Law Finder",
};

export default async function CaseLawPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const { citations, judgments } = await getCaseLawData(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Case Law Finder</h1>
        <p className="text-[13px] text-muted-foreground">
          Judgments in your library and the precedents cited within them,
          extracted by the AI engine.
        </p>
      </div>
      <CaseLawExplorer
        citations={citations}
        judgments={judgments.map((j) => ({
          ...j,
          decisionDate: j.decisionDate ? j.decisionDate.toISOString() : null,
        }))}
      />
    </div>
  );
}
