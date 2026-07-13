import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/motion";
import type { DetailedFeature } from "@/types";

export function DetailedFeatureRow({
  feature,
  index,
}: {
  feature: DetailedFeature;
  index: number;
}) {
  const flipped = index % 2 === 1;
  return (
    <section id={feature.id} className="scroll-mt-24 py-8 sm:py-12">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className={cn(flipped && "lg:order-2")}>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </span>
              {feature.badge && <Badge variant="accent">{feature.badge}</Badge>}
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {feature.title}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {feature.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                    <Check className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            variants={{
              hidden: { opacity: 0, scale: 0.96 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
            }}
            className={cn(flipped && "lg:order-1")}
          >
            <FeatureVisual feature={feature} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function FeatureVisual({ feature }: { feature: DetailedFeature }) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-dot opacity-40" />
      <div className="relative space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <feature.icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">{feature.title}</span>
        </div>
        <div className="space-y-2.5">
          <div className="h-2.5 w-full rounded-full bg-muted" />
          <div className="h-2.5 w-[90%] rounded-full bg-muted" />
          <div className="h-2.5 w-[75%] rounded-full bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          {feature.points.slice(0, 4).map((point) => (
            <div
              key={point}
              className="flex items-center gap-2 rounded-lg border border-border bg-background p-3"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
              <span className="truncate text-xs text-muted-foreground">{point}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
