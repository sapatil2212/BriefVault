import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/motion";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  muted?: boolean;
}

export function Section({ children, className, id, muted }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 py-10 sm:py-14",
        muted && "bg-muted/60",
        className
      )}
    >
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "mx-auto max-w-2xl items-center text-center",
        align === "left" && "max-w-2xl items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <Badge variant="default" className="uppercase tracking-wide">
          {eyebrow}
        </Badge>
      )}
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
        {title}
      </h2>
      {description && (
        <p className="text-balance text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </Reveal>
  );
}
