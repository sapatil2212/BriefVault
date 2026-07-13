"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Globe,
  Mail,
  MapPin,
  Monitor,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/admin/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminPendingUserDetail,
  usePendingUserAction,
  usePlans,
  type PendingUserAction,
} from "@/hooks/use-admin";
import { timeAgo } from "@/lib/format";
import { formatPlanPrice } from "@/lib/plans/types";

type Mode = "view" | "approve" | "reject" | "changePlan";

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="truncate text-[13px] text-foreground">{value ?? "—"}</div>
      </div>
    </div>
  );
}

export function PendingUserDialog({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const open = Boolean(userId);
  const { data, isLoading } = useAdminPendingUserDetail(userId);
  const { data: plans } = usePlans();
  const action = usePendingUserAction();

  const [mode, setMode] = React.useState<Mode>("view");
  const [planKey, setPlanKey] = React.useState<string>("");
  const [text, setText] = React.useState("");

  // Reset transient action state whenever a different user is opened.
  React.useEffect(() => {
    setMode("view");
    setText("");
    setPlanKey(data?.subscription?.planKey ?? "");
  }, [userId, data?.subscription?.planKey]);

  const run = async (payload: PendingUserAction, successMsg: string) => {
    if (!userId) return;
    try {
      await action.mutateAsync({ id: userId, ...payload });
      toast.success(successMsg);
      setMode("view");
      setText("");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    }
  };

  const busy = action.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="text-lg">Pending user review</DialogTitle>
          <DialogDescription className="text-sm">
            Review the applicant and decide on their subscription request.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Identity + status */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {data.firstName} {data.lastName}
                </div>
                <div className="text-xs text-muted-foreground">{data.designation ?? "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill value={data.status} />
                {data.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="text-xs font-medium text-amber-600">Unverified</span>
                )}
              </div>
            </div>

            {/* Info grid - Compact 3 columns */}
            <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-3">
              <Row icon={Mail} label="Email" value={data.email} />
              <Row icon={Phone} label="Mobile" value={data.phone} />
              <Row icon={Building2} label="Organization" value={data.organization} />
              <Row icon={UserIcon} label="Org type" value={data.orgType?.replace(/_/g, " ")} />
              <Row icon={MapPin} label="Country" value={data.country} />
              <Row icon={CalendarClock} label="Registered" value={timeAgo(data.createdAt)} />
            </div>

            {/* Selected plan */}
            {data.subscription && (
              <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Selected plan</div>
                  <div className="text-[13px] font-semibold text-foreground">
                    {data.subscription.planName}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {formatPlanPrice(data.subscription.priceMonthly, data.subscription.currency)}
                      {data.subscription.priceMonthly > 0 && " / mo"}
                    </span>
                  </div>
                </div>
                <StatusPill value={data.subscription.status} />
              </div>
            )}

            {/* Signup context - Compact */}
            <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-3">
              <Row icon={Globe} label="IP address" value={data.signup.ip} />
              <Row icon={Monitor} label="Device" value={data.signup.device} />
              <Row icon={ShieldCheck} label="Browser" value={data.signup.browser} />
            </div>

            {/* Approval history */}
            {data.approvals.length > 0 && (
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  History
                </div>
                <ul className="space-y-1.5">
                  {data.approvals.map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-border px-2.5 py-1.5 text-xs">
                      <div>
                        <StatusPill value={a.decision} />
                        {a.remarks && <p className="mt-1 text-[11px] text-muted-foreground">{a.remarks}</p>}
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action area */}
            <div className="border-t border-border pt-3">
              {mode === "view" && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setMode("approve")} disabled={data.status === "ACTIVE"}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setMode("reject")} disabled={data.status === "REJECTED"}>
                    Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setMode("changePlan")}>
                    Change plan
                  </Button>
                  {data.status === "ACTIVE" ? (
                    <Button size="sm" variant="outline" className="text-rose-600" onClick={() => run({ action: "suspend" }, "User suspended.")} disabled={busy}>
                      Suspend
                    </Button>
                  ) : data.status === "SUSPENDED" ? (
                    <Button size="sm" variant="outline" onClick={() => run({ action: "reactivate" }, "User reactivated.")} disabled={busy}>
                      Reactivate
                    </Button>
                  ) : null}
                </div>
              )}

              {mode === "approve" && (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-medium text-foreground">Assign plan</label>
                    <Select value={planKey} onChange={(e) => setPlanKey(e.target.value)} className="mt-1 h-9 text-sm">
                      {(plans ?? []).map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.name} · {formatPlanPrice(p.priceMonthly, p.currency)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setMode("view")}>Cancel</Button>
                    <Button size="sm" onClick={() => run({ action: "approve", plan: planKey || undefined }, "User approved and activated.")} disabled={busy}>
                      Approve &amp; activate
                    </Button>
                  </div>
                </div>
              )}

              {mode === "reject" && (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-medium text-foreground">Reason for rejection</label>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Explain why this application is declined…"
                      className="mt-1 min-h-[80px] text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setMode("view")}>Cancel</Button>
                    <Button size="sm" variant="outline" className="border-rose-500/40 text-rose-600 hover:bg-rose-500/10" onClick={() => run({ action: "reject", reason: text }, "User rejected.")} disabled={busy || text.trim().length < 3}>
                      Reject application
                    </Button>
                  </div>
                </div>
              )}

              {mode === "changePlan" && (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-medium text-foreground">New plan</label>
                    <Select value={planKey} onChange={(e) => setPlanKey(e.target.value)} className="mt-1 h-9 text-sm">
                      {(plans ?? []).map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.name} · {formatPlanPrice(p.priceMonthly, p.currency)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setMode("view")}>Cancel</Button>
                    <Button size="sm" onClick={() => run({ action: "changePlan", plan: planKey }, "Plan updated.")} disabled={busy || !planKey}>
                      Update plan
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
