"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Animation duration, e.g. "40s". Longer = slower. */
  duration?: string;
  /** Fade the horizontal edges. */
  fade?: boolean;
  /** Pause the scroll on hover. */
  pauseOnHover?: boolean;
}

export function Marquee({
  children,
  className,
  duration = "40s",
  fade = true,
  pauseOnHover = true,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden",
        fade && "mask-fade-x",
        pauseOnHover && "pause-on-hover",
        className
      )}
    >
      <div
        className="flex w-max animate-marquee items-stretch"
        style={{ animationDuration: duration }}
      >
        {/* Two identical tracks for a seamless loop */}
        <div className="flex shrink-0 items-stretch">{children}</div>
        <div className="flex shrink-0 items-stretch" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
