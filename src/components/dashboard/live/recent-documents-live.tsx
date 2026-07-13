"use client";

import Link from "next/link";
import { FileText, Upload, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { timeAgo } from "@/lib/format";

/** Recent Documents table backed by live stats. */
export function RecentDocumentsLive() {
  const { data, isLoading, isError } = useDashboardStats();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-foreground">Recent Documents</h2>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110"
        >
          <Upload className="h-3 w-3" />
          Upload New
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="mt-4 text-[13px] text-red-600 dark:text-red-400">Couldn&apos;t load documents.</p>
      ) : !data || data.recentDocuments.length === 0 ? (
        <EmptyState
          className="mt-4 border-0 p-8"
          icon={FileText}
          title="No documents yet"
          description="Upload your first legal document to see it here."
          action={
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:brightness-110"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Document
            </Link>
          }
        />
      ) : (
        <>
          <div className="mt-3.5 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium text-muted-foreground">
                  <th className="pb-2.5 font-medium">Document Name</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium">Insights</th>
                  <th className="pb-2.5 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/60"
                  >
                    <td className="py-2.5">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="flex items-center gap-2 font-medium text-foreground hover:text-violet-500"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{doc.title}</span>
                      </Link>
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-2.5 text-muted-foreground">{doc.resultCount}</td>
                    <td className="py-2.5 text-muted-foreground">{timeAgo(doc.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3.5 flex justify-center">
            <Link
              href="/dashboard/documents"
              className="flex items-center gap-1 text-[13px] font-medium text-violet-500 hover:underline"
            >
              View All Documents
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
