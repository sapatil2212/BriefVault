import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowUpRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserSubscription } from "@/lib/subscriptions/service";
import { CompareView } from "@/components/compare/compare-view";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Compare Documents",
};

export default async function ComparePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const sub = await getUserSubscription(user.id);
  const isFreePlan = !sub || sub.plan.key === "FREE";

  if (isFreePlan) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Compare Documents</h1>
          <p className="text-[13px] text-muted-foreground">
            Spot added, removed, and modified content between two documents.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15">
            <Lock className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-foreground">
            Document Comparison is not included in the Free Plan
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-muted-foreground">
            Upgrade your subscription to unlock automated contract redlining, clause diffing, and side-by-side legal document comparison.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700 shadow-sm"
            >
              <ArrowUpRight className="h-4 w-4" />
              Upgrade Plan
            </Link>
            <Link
              href="/dashboard/documents"
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
            >
              Back to My Documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Compare Documents</h1>
        <p className="text-[13px] text-muted-foreground">
          Spot added, removed, and modified content between two documents.
        </p>
      </div>
      <CompareView />
    </div>
  );
}

