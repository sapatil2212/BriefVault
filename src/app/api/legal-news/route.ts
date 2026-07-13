import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300; // Cache for 5 minutes

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: "Supreme Court" | "High Court" | "Regulation" | "Amendment" | "Notification";
  date: string;
  url?: string;
  trending?: boolean;
}

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "fb-1",
    title: "Supreme Court Ruling on Digital Rights and Privacy Compliance",
    summary: "The Supreme Court delivered key directions regarding digital evidence standards and privacy compliance.",
    source: "Supreme Court of India",
    category: "Supreme Court",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    trending: true,
    url: "https://sci.gov.in",
  },
  {
    id: "fb-2",
    title: "Ministry of Law Issues Directive on Digital Court Filings",
    summary: "New rules mandating e-filing across all tribunals and appellate authorities.",
    source: "Ministry of Law & Justice",
    category: "Notification",
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    trending: true,
  },
  {
    id: "fb-3",
    title: "SEBI Mandates Extended Disclosures for Related Party Transactions",
    summary: "Securities and Exchange Board of India releases updated governance standards for listed entities.",
    source: "SEBI",
    category: "Regulation",
    date: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
  },
];

export async function GET() {
  try {
    const rssUrls = [
      "https://news.google.com/rss/search?q=Supreme+Court+India+OR+High+Court+OR+SEBI+OR+RBI+law&hl=en-IN&gl=IN&ceid=IN:en",
      "https://news.google.com/rss/search?q=legal+judgment+India+OR+Ministry+of+Law+Justice&hl=en-IN&gl=IN&ceid=IN:en",
    ];

    const fetchPromises = rssUrls.map(async (url) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { "User-Agent": "BriefVault-LegalNews/1.0" },
          next: { revalidate: 300 },
        });
        clearTimeout(timeout);
        if (!res.ok) return "";
        return await res.text();
      } catch {
        clearTimeout(timeout);
        return "";
      }
    });

    const results = await Promise.all(fetchPromises);
    const combinedXml = results.join("\n");

    const items: NewsItem[] = [];
    const seenTitles = new Set<string>();

    const matches = [...combinedXml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

    for (let i = 0; i < matches.length && items.length < 25; i++) {
      const itemXml = matches[i][1];
      const rawTitle = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
      const cleanTitle = rawTitle
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/ - [^-]+$/, "")
        .trim();

      if (!cleanTitle || seenTitles.has(cleanTitle.toLowerCase())) continue;
      seenTitles.add(cleanTitle.toLowerCase());

      const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
      const rawLink = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "Legal Feed";
      const cleanSource = sourceMatch.replace(/<!\[CDATA\[|\]\]>/g, "").trim();

      let category: NewsItem["category"] = "Notification";
      const titleLower = cleanTitle.toLowerCase();
      if (titleLower.includes("supreme court") || titleLower.includes("sc ")) {
        category = "Supreme Court";
      } else if (titleLower.includes("high court") || titleLower.includes("hc ")) {
        category = "High Court";
      } else if (titleLower.includes("amend") || titleLower.includes("bill") || titleLower.includes("act")) {
        category = "Amendment";
      } else if (titleLower.includes("sebi") || titleLower.includes("rbi") || titleLower.includes("regulat") || titleLower.includes("rule")) {
        category = "Regulation";
      }

      let formattedDate = new Date().toISOString();
      if (pubDate) {
        const parsed = new Date(pubDate);
        if (!isNaN(parsed.getTime())) {
          formattedDate = parsed.toISOString();
        }
      }

      items.push({
        id: `news-${i}-${Date.now()}`,
        title: cleanTitle,
        summary: cleanTitle,
        source: cleanSource,
        category,
        date: formattedDate,
        url: rawLink || undefined,
        trending: items.length < 3,
      });
    }

    if (items.length === 0) {
      return NextResponse.json({ success: true, data: FALLBACK_NEWS, source: "fallback" });
    }

    return NextResponse.json({ success: true, data: items, source: "live" });
  } catch (error) {
    console.error("Legal news fetch error:", error);
    return NextResponse.json({ success: true, data: FALLBACK_NEWS, source: "fallback" });
  }
}
