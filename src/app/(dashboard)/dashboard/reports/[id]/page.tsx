import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getReport } from "@/lib/ai/services/report-service";
import { ReportView } from "@/components/reports/report-view";

export const runtime = "nodejs";

interface Section {
  heading: string;
  body: string;
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const { id } = await params;
  const report = await getReport(user.id, id);
  if (!report) notFound();

  const sections = (report.sections as unknown as Section[]) ?? [];
  const meta = `Generated ${new Date(report.createdAt).toLocaleString()}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/dashboard/reports"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reports
      </Link>

      <ReportView
        title={report.title}
        sections={sections}
        markdown={report.markdown}
        meta={meta}
      />
    </div>
  );
}
