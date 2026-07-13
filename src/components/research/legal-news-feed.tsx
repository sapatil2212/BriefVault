"use client";

import * as React from "react";
import { Newspaper, TrendingUp, Scale, Calendar, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: "Supreme Court" | "High Court" | "Regulation" | "Amendment" | "Notification";
  date: string;
  url?: string;
  trending?: boolean;
}

// Sample legal news data (replace with real API in production)
const SAMPLE_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Supreme Court Landmark Judgment on Digital Privacy Rights",
    summary: "The Supreme Court has delivered a significant ruling strengthening digital privacy protections for citizens.",
    source: "Supreme Court of India",
    category: "Supreme Court",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    trending: true,
  },
  {
    id: "2",
    title: "New GST Amendment Bill Passed in Parliament",
    summary: "Parliament approves amendments to GST framework affecting small businesses and e-commerce platforms.",
    source: "Ministry of Finance",
    category: "Amendment",
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "SEBI Issues New Guidelines for Listed Companies",
    summary: "Securities and Exchange Board of India announces revised disclosure norms for listed entities.",
    source: "SEBI",
    category: "Regulation",
    date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    trending: true,
  },
  {
    id: "4",
    title: "Delhi High Court Ruling on Environmental Compliance",
    summary: "High Court mandates stricter environmental compliance measures for construction projects.",
    source: "Delhi High Court",
    category: "High Court",
    date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    title: "RBI Notification on Banking Regulations Update",
    summary: "Reserve Bank issues updated guidelines on digital banking and cybersecurity requirements.",
    source: "Reserve Bank of India",
    category: "Notification",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const categoryColors: Record<NewsItem["category"], string> = {
  "Supreme Court": "bg-red-500/10 text-red-600 dark:text-red-400",
  "High Court": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "Regulation": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Amendment": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "Notification": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

/**
 * Legal news feed component showing latest legal updates, judgments,
 * and regulatory changes relevant to legal professionals.
 */
export function LegalNewsFeed() {
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<NewsItem["category"] | "all">("all");

  const fetchNews = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/legal-news");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNews(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to load legal news:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const filteredNews = React.useMemo(() => {
    if (filter === "all") return news;
    return news.filter((item) => item.category === filter);
  }, [news, filter]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Newspaper className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">Legal News & Updates</h2>
              <p className="text-[11px] text-muted-foreground">Latest legal developments</p>
            </div>
          </div>
          <button
            onClick={fetchNews}
            disabled={loading}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Refresh"
            title="Refresh news"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="mt-3 flex gap-1 overflow-x-auto">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterTab>
          <FilterTab active={filter === "Supreme Court"} onClick={() => setFilter("Supreme Court")}>
            SC
          </FilterTab>
          <FilterTab active={filter === "High Court"} onClick={() => setFilter("High Court")}>
            HC
          </FilterTab>
          <FilterTab active={filter === "Regulation"} onClick={() => setFilter("Regulation")}>
            Reg
          </FilterTab>
          <FilterTab active={filter === "Amendment"} onClick={() => setFilter("Amendment")}>
            Amd
          </FilterTab>
          <FilterTab active={filter === "Notification"} onClick={() => setFilter("Notification")}>
            Not
          </FilterTab>
        </div>
      </div>

      {/* News feed */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && news.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="animate-pulse rounded-lg border border-border p-3 space-y-2">
                <div className="h-3 w-16 bg-muted rounded"></div>
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-3 w-3/4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Newspaper className="h-8 w-8 text-muted-foreground opacity-50" />
            <p className="mt-2 text-[13px] text-muted-foreground">
              No news in this category
            </p>
          </div>
        ) : (
          filteredNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))
        )}
      </div>

      {/* Footer - Quick Stats */}
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {news.filter((n) => n.trending).length} trending
          </span>
          <span className="flex items-center gap-1">
            <Scale className="h-3 w-3" />
            {news.length} updates live
          </span>
        </div>
      </div>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="group rounded-lg border border-border bg-card/50 p-3 transition hover:border-violet-500/40 hover:bg-card hover:shadow-sm">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", categoryColors[item.category])}>
            {item.category}
          </span>
          {item.trending && (
            <span className="flex items-center gap-1 text-[10px] text-orange-500">
              <TrendingUp className="h-3 w-3" />
              Trending
            </span>
          )}
        </div>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-md p-1 text-muted-foreground opacity-70 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
            title="Open original source"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Content */}
      <h3 className="mb-1.5 text-[13px] font-semibold leading-snug text-foreground">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            {item.title}
          </a>
        ) : (
          item.title
        )}
      </h3>
      <p className="mb-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
        {item.summary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate max-w-[200px]" title={item.source}>{item.source}</span>
        <span className="flex items-center gap-1 shrink-0">
          <Calendar className="h-3 w-3" />
          {timeAgo(item.date)}
        </span>
      </div>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition",
        active
          ? "bg-violet-600 text-white"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
