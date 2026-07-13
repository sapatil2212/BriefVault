"use client";

import { Marquee } from "@/components/shared/marquee";
import { homeFeatures } from "@/data/features";

export function FeatureMarquee() {
  return (
    <div>
      <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Everything BriefVault does, in one platform
      </p>
      <div className="mt-6">
        <Marquee duration="55s">
          {homeFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="mx-2 flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="whitespace-nowrap text-sm font-medium text-foreground">
                  {feature.title}
                </span>
              </div>
            );
          })}
        </Marquee>
      </div>
    </div>
  );
}
