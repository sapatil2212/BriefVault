"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  FileText,
  Globe,
  Mail,
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusPill } from "@/components/admin/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUserDetail, useUserAction } from "@/hooks/use-admin";
import { ORG_TYPE_VALUES } from "@/lib/validations/auth";
import { formatDate, timeAgo } from "@/lib/format";

const ORG_TYPE_LABELS: Record<string, string> = {
  LAW_FIRM: "Law Firm",
  CHARTERED_ACCOUNTANT: "Chartered Accountant",
  COMPANY_SECRETARY: "Company Secretary",
  TAX_CONSULTANT: "Tax Consultant",
  CORPORATE_LEGAL_TEAM: "Corporate Legal Team",
  BANK_NBFC: "Bank / NBFC",
  GOVERNMENT: "Government",
  STARTUP: "Startup",
  OTHER: "Other",
};

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
 * View / edit dialog for a single platform user. Opened from the "eye" (view)
 * or "edit" (pencil) row action — both share this dialog; `editMode` just
 * decides whether the profile editor starts open.
 */
export function UserDialog({
  userId,
  editMode = false,
  onClose,
}: {
  userId: string | null;
  editMode?: boolean;
  onClose: () => void;
}) {
  const open = Boolean(userId);
  const { data, isLoading } = useAdminUserDetail(userId);
  const action = useUserAction();

  const [editing, setEditing] = React.useState(editMode);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [orgType, setOrgType] = React.useState<string>("OTHER");
  const [status, setStatus] = React.useState<"ACTIVE" | "SUSPENDED">("ACTIVE");

  React.useEffect(() => {
    setEditing(editMode);
    if (data) {
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhone(data.phone);
      setOrganization(data.organization);
      setOrgType(data.orgType);
      setStatus(data.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE");
    }
  }, [userId, editMode, data]);

  const save = async () => {
    if (!userId) return;
    try {
      await action.mutateAsync({
        id: userId,
        action: "updateProfile",
        firstName,
        lastName,
        phone,
        organization,
        orgType,
        status,
      });
      toast.success("User updated.");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="text-lg">User details</DialogTitle>
          <DialogDescription className="text-sm">
            {editing ? "Update this user's profile and status." : "Profile, sessions, and activity for this account."}
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
                <div className="text-xs text-muted-foreground">{data.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill value={data.status} />
                {data.emailVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
            </div>

            {/* Info grid */}
            <div className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
              <Row icon={Mail} label="Email" value={data.email} />
              <Row icon={Phone} label="Phone" value={data.phone} />
              <Row icon={Building2} label="Organization" value={data.organization} />
              <Row icon={UserIcon} label="Org type" value={ORG_TYPE_LABELS[data.orgType] ?? data.orgType} />
              <Row icon={Calendar} label="Joined" value={formatDate(data.createdAt)} />
              <Row icon={Calendar} label="Last login" value={data.lastLoginAt ? timeAgo(data.lastLoginAt) : "Never"} />
              <Row icon={FileText} label="Documents" value={String(data.counts.documents)} />
              <Row icon={Monitor} label="Active sessions" value={String(data.sessions.length)} />
            </div>

            {/* Recent sessions */}
            {data.sessions.length > 0 && (
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent sessions
                </div>
                <ul className="space-y-1.5">
                  {data.sessions.slice(0, 5).map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-2.5 py-1.5 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Globe className="h-3 w-3" /> {s.ipAddress ?? "Unknown IP"}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(s.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Edit area */}
            <div className="border-t border-border pt-3">
              {editing ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">First name</label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Last name</label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Phone</label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Status</label>
                      <Select value={status} onChange={(e) => setStatus(e.target.value as "ACTIVE" | "SUSPENDED")} className="mt-1 h-9 text-sm">
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Organization</label>
                      <Input value={organization} onChange={(e) => setOrganization(e.target.value)} className="mt-1 h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Org type</label>
                      <Select value={orgType} onChange={(e) => setOrgType(e.target.value)} className="mt-1 h-9 text-sm">
                        {ORG_TYPE_VALUES.map((v) => (
                          <option key={v} value={v}>
                            {ORG_TYPE_LABELS[v]}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={save}
                      disabled={action.isPending || !firstName.trim() || !lastName.trim() || !organization.trim()}
                    >
                      Save changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    Edit user
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
