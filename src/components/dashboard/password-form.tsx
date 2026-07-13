"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Key } from "lucide-react";

const fieldCls =
  "h-10 w-full rounded-lg border border-border bg-muted px-3 text-[13px] text-foreground outline-none transition focus:border-violet-400 focus:bg-card focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60";
const labelCls = "text-[13px] font-medium text-foreground";

export function PasswordForm() {
  const [form, setForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("Use at least 8 characters for the new password.");
      return;
    }
    if (form.newPassword !== form.confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error ?? json?.message ?? "Failed to update password.");
        return;
      }
      toast.success("Password updated successfully.");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className={labelCls}>Current password</label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={set("currentPassword")}
            className={fieldCls}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>New password</label>
          <input
            type="password"
            value={form.newPassword}
            onChange={set("newPassword")}
            className={fieldCls}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Confirm new password</label>
          <input
            type="password"
            value={form.confirmNewPassword}
            onChange={set("confirmNewPassword")}
            className={fieldCls}
            placeholder="••••••••"
          />
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
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
        Update password
      </button>
    </form>
  );
}
