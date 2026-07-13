"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Building2,
  CalendarClock,
  Mail,
  MessageSquareText,
  Phone,
  Briefcase,
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
  useAdminDemoEnquiryDetail,
  useUpdateDemoEnquiry,
  type DemoEnquiryRow,
} from "@/hooks/use-admin";
import { formatDate, timeAgo } from "@/lib/format";

const STATUS_OPTIONS = ["NEW", "CONTACTED", "SCHEDULED", "CLOSED"] as const;

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

/**
 * View / edit dialog for a single demo enquiry. Opened from the "eye" (view)
 * or "edit" (pencil) row action — both share this dialog; `editMode` just
 * decides whether the status/notes editor starts open.
 */
export function DemoEnquiryDialog({
  enquiryId,
  editMode = false,
  onClose,
}: {
  enquiryId: string | null;
  editMode?: boolean;
  onClose: () => void;
}) {
  const open = Boolean(enquiryId);
  const { data, isLoading } = useAdminDemoEnquiryDetail(enquiryId);
  const update = useUpdateDemoEnquiry();

  const [status, setStatus] = React.useState<DemoEnquiryRow["status"]>("NEW");
  const [notes, setNotes] = React.useState("");
  const [editing, setEditing] = React.useState(editMode);

  React.useEffect(() => {
    setEditing(editMode);
    setStatus(data?.status ?? "NEW");
    setNotes(data?.notes ?? "");
  }, [enquiryId, editMode, data?.status, data?.notes]);

  const save = async () => {
    if (!enquiryId) return;
    try {
      await update.mutateAsync({ id: enquiryId, status, notes });
      toast.success("Enquiry updated.");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="text-lg">Demo enquiry</DialogTitle>
          <DialogDescription className="text-sm">
            {editing ? "Update the triage status and internal notes." : "Submitted details from the public site."}
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
                <div className="text-sm font-semibold text-foreground">{data.name}</div>
                <div className="text-xs text-muted-foreground">{data.company}</div>
              </div>
              <StatusPill value={data.status} />
            </div>

            {/* Info grid */}
            <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
              <Row icon={Mail} label="Email" value={data.email} />
              <Row icon={Phone} label="Phone" value={data.phone} />
              <Row icon={Building2} label="Company" value={data.company} />
              <Row icon={Briefcase} label="Business type" value={data.businessType} />
              {data.whatsapp && <Row icon={MessageSquareText} label="WhatsApp" value={data.whatsapp} />}
              <Row
                icon={CalendarClock}
                label="Preferred slot"
                value={
                  data.preferredDate
                    ? `${formatDate(data.preferredDate)}${data.preferredTime ? ` · ${data.preferredTime}` : ""}`
                    : "—"
                }
              />
              <Row icon={CalendarClock} label="Submitted" value={`${formatDate(data.createdAt)} (${timeAgo(data.createdAt)})`} />
            </div>

            {/* Message */}
            {data.message && (
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Message
                </div>
                <p className="rounded-lg border border-border bg-muted/30 p-3 text-[13px] leading-relaxed text-foreground">
                  {data.message}
                </p>
              </div>
            )}

            {/* Internal notes (read-only view) */}
            {!editing && data.notes && (
              <div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Internal notes
                </div>
                <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[13px] leading-relaxed text-foreground">
                  {data.notes}
                </p>
              </div>
            )}

            {/* Edit area */}
            <div className="border-t border-border pt-3">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground">Status</label>
                    <Select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as DemoEnquiryRow["status"])}
                      className="mt-1 h-9 text-sm"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Internal notes</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes for your team (not visible to the applicant)…"
                      className="mt-1 min-h-[80px] text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={save} disabled={update.isPending}>
                      Save changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    Edit status &amp; notes
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
