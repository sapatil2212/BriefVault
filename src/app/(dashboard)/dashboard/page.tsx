import { StatCardsLive } from "@/components/dashboard/live/stat-cards-live";
import { CategoryDonutLive } from "@/components/dashboard/live/category-donut-live";
import { RecentDocumentsLive } from "@/components/dashboard/live/recent-documents-live";
import { SummaryOverviewLive } from "@/components/dashboard/live/summary-overview-live";
import { AiInsightsLive } from "@/components/dashboard/live/ai-insights-live";
import { QuickActions } from "@/components/dashboard/quick-actions";

/**
 * Dashboard home. Every panel is driven by live data from
 * `/api/dashboard/stats` — KPIs, category chart, summary trend,
 * recent documents and AI insights all reflect the signed-in user's real data.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <StatCardsLive />

      {/* Analytics row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-5 h-full">
          <SummaryOverviewLive />
        </div>
        <div className="xl:col-span-4 h-full">
          <CategoryDonutLive />
        </div>
        <div className="xl:col-span-3 h-full">
          <QuickActions />
        </div>
      </div>

      {/* Documents + side rail */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <RecentDocumentsLive />
        </div>
        <div className="xl:col-span-4">
          <AiInsightsLive />
        </div>
      </div>
    </div>
  );
}
