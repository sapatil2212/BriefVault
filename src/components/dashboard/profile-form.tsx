"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Building2 } from "lucide-react";
import { ORG_TYPES } from "@/lib/validations/auth";
import { CustomSelect } from "@/components/ui/custom-select";
import { Select } from "@/components/ui/select";
import { COUNTRIES } from "@/constants/countries";

interface Initial {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  orgType: string; // label
  designation: string;
  country: string;
}

const fieldCls =
  "h-10 w-full rounded-lg border border-border bg-muted px-3 text-[13px] text-foreground outline-none transition focus:border-violet-400 focus:bg-card focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60";
const labelCls = "text-[13px] font-medium text-foreground";

/** Editable profile form wired to PATCH /api/auth/me. */
export function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = (k: keyof Initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const setOrgType = (value: string) => setForm((f) => ({ ...f, orgType: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          organization: form.organization,
          orgType: form.orgType,
          designation: form.designation,
          country: form.country,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error ?? json?.message ?? "Failed to update profile.");
        return;
      }
      toast.success("Profile updated.");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={labelCls}>First name</label>
          <input value={form.firstName} onChange={set("firstName")} className={fieldCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Last name</label>
          <input value={form.lastName} onChange={set("lastName")} className={fieldCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Phone</label>
          <input value={form.phone} onChange={set("phone")} className={fieldCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Email</label>
          <input value={form.email} disabled className={fieldCls} title="Email can't be changed here" />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Organization</label>
          <input value={form.organization} onChange={set("organization")} className={fieldCls} />
        </div>
        <div>
          <CustomSelect
            label="Organization type"
            value={form.orgType}
            onChange={setOrgType}
            options={ORG_TYPES.map((t) => ({
              value: t,
              label: t,
              icon: <Building2 className="h-4 w-4 text-violet-500" />,
            }))}
            placeholder="Select organization type"
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Designation</label>
          <input value={form.designation} onChange={set("designation")} className={fieldCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Country</label>
          <Select
            value={form.country}
            onChange={set("country")}
            className="h-10 text-[13px] bg-muted focus:bg-card"
          >
            <option value="" disabled>Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save changes
      </button>
    </form>
  );
}
