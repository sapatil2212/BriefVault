import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscriptionOverview } from "@/lib/subscriptions/service";
import { getPublicPlans } from "@/lib/plans/service";
import { SubscriptionManager } from "@/components/dashboard/subscription-manager";

export const metadata: Metadata = {
  title: "Subscription & Plans",
  description: "View available plans, manage your subscription, and track workspace usage.",
};

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const [overview, plans] = await Promise.all([
    getSubscriptionOverview(user.id),
    getPublicPlans(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <SubscriptionManager overview={overview} plans={plans} />
    </div>
  );
}
