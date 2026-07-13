import {
  LayoutDashboard,
  Gavel,
  User,
  Users,
  CalendarDays,
  Clock,
  BadgeCheck,
  ScrollText,
  HelpCircle,
} from "lucide-react";

export interface ExecutiveDashboardProps {
  documentType: string;
  status: string;
  confidence?: number | null;
  provider?: string | null;
  readingTimeSavedMinutes?: number | null;
  court?: string | null;
  authority?: string | null;
  judge?: string | null;
  caseNumber?: string | null;
  notificationNumber?: string | null;
  decisionDate?: string | null;
  petitioners?: string[];
  respondents?: string[];
  decision?: string | null;
  result?: string | null;
  acts?: string[];
  sections?: string[];
  keywords?: string[];
  keyIssues?: string[];
  importantDates?: { label: string; detail: string | null }[];
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gavel;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 truncate text-[12px] font-medium text-foreground" title={value ?? undefined}>
        {value && value.trim() ? value : "—"}
      </p>
    </div>
  );
}

function Chips({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.slice(0, 24).map((item, i) => (
          <span
            key={i}
            className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Executive Dashboard (Module 1): an at-a-glance panel that fuses extracted
 * metadata with the AI summary and derived key issues / important dates / acts.
 * Purely presentational — every value is real data from the pipeline.
 */
export function ExecutiveDashboard(props: ExecutiveDashboardProps) {
  const parties =
    props.petitioners?.length || props.respondents?.length
      ? `${(props.petitioners ?? []).join(", ") || "—"} v. ${
          (props.respondents ?? []).join(", ") || "—"
        }`
      : null;

  const confidencePct =
    props.confidence != null ? `${Math.round(props.confidence * 100)}%` : null;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-[13px] font-semibold text-foreground">Executive Dashboard</h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {props.provider && (
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium capitalize">
              {props.provider}
            </span>
          )}
          {confidencePct && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium">
              <BadgeCheck className="h-3 w-3" />
              {confidencePct}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          <Stat icon={ScrollText} label="Type" value={props.documentType} />
          <Stat icon={Gavel} label="Court / Authority" value={props.court ?? props.authority} />
          <Stat icon={User} label="Judge" value={props.judge} />
          <Stat icon={Users} label="Parties" value={parties} />
          <Stat icon={ScrollText} label="Case No." value={props.caseNumber ?? props.notificationNumber} />
          <Stat
            icon={CalendarDays}
            label="Decision Date"
            value={props.decisionDate ? new Date(props.decisionDate).toLocaleDateString() : null}
          />
          <Stat icon={Gavel} label="Result" value={props.result ?? props.decision} />
          <Stat
            icon={Clock}
            label="Reading Saved"
            value={
              props.readingTimeSavedMinutes && props.readingTimeSavedMinutes > 0
                ? `~${props.readingTimeSavedMinutes} min`
                : null
            }
          />
        </div>

        {/* Key issues */}
        {props.keyIssues && props.keyIssues.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <HelpCircle className="h-3 w-3" /> Key Issues
            </p>
            <ul className="space-y-1">
              {props.keyIssues.slice(0, 6).map((q, i) => (
                <li key={i} className="flex gap-2 text-[12px] text-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Important dates */}
        {props.importantDates && props.importantDates.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="h-3 w-3" /> Important Dates
            </p>
            <ul className="space-y-1">
              {props.importantDates.slice(0, 6).map((d, i) => (
                <li key={i} className="flex items-baseline gap-2 text-[12px]">
                  <span className="shrink-0 font-medium text-foreground">{d.label}</span>
                  {d.detail && <span className="truncate text-muted-foreground">{d.detail}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Chips label="Acts Referred" items={props.acts} />
        <Chips label="Important Sections" items={props.sections} />
        <Chips label="Keywords" items={props.keywords} />
      </div>
    </section>
  );
}
