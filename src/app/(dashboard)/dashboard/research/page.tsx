import type { Metadata } from "next";
import { AiChat } from "@/components/ai/ai-chat";
import { LegalNewsFeed } from "@/components/research/legal-news-feed";

export const metadata: Metadata = {
  title: "Legal Research",
  description: "AI-powered legal research with latest news and updates.",
};

export default function ResearchPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Legal Research</h1>
        <p className="text-[13px] text-muted-foreground">
          AI-powered research assistant with latest legal news and updates
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
        {/* Left: News Feed */}
        <div className="hidden min-h-0 lg:block">
          <LegalNewsFeed />
        </div>

        {/* Right: AI Chat */}
        <div className="min-h-0">
          <AiChat 
            title="Legal Research Assistant"
            suggestions={[
              "What are recent Supreme Court judgments?",
              "Explain the latest GST amendments",
              "Summarize key compliance updates",
              "What changed in SEBI regulations?",
            ]}
          />
        </div>
      </div>

      {/* Mobile: Show news below chat */}
      <div className="lg:hidden">
        <LegalNewsFeed />
      </div>
    </div>
  );
}
