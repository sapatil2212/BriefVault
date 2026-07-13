import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileType2, Clock, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listSummaries } from "@/lib/ai/services/document-service";
import { EmptyState } from "@/components/ui/empty-state";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Summaries",
};

export default async function SummariesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const summaries = await listSummaries(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Summaries</h1>
        <p className="text-[13px] text-muted-foreground">
          {summaries.length} AI-generated executive summar{summaries.length === 1 ? "y" : "ies"}
        </p>
      </div>

      {summaries.length === 0 ? (
        <EmptyState
          icon={FileType2}
          title="No summaries yet"
          description="Upload and process a document to generate its executive summary."
          action={
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110"
            >
              Upload Document
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {summaries.map((s) => (
            <Link
              key={s.documentId}
              href={`/dashboard/documents/${s.documentId}`}
              className="group rounded-xl border border-border bg-card p-4 transition hover:border-violet-500/40 hover:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                  <FileType2 className="h-4 w-4" />
                </span>
                <h2 className="line-clamp-1 flex-1 text-[14px] font-semibold text-foreground group-hover:text-violet-500">
                  {s.title}
                </h2>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-violet-500" />
              </div>
              <p className="mt-2.5 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                {s.overview ?? "No overview available."}
              </p>
              <div className="mt-3 flex items-center gap-3 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Clock className="h-3 w-3" />
                  ~{s.readingTimeSavedMinutes} min saved
                </span>
                <span>confidence {Math.round(s.confidence * 100)}%</span>
                <span className="ml-auto">{new Date(s.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
