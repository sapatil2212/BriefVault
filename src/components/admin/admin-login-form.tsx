"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldAlert, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const schema = z.object({
  username: z.string().min(1, "Enter your admin username."),
  password: z.string().min(1, "Enter your password."),
});
type FormValues = z.infer<typeof schema>;

/**
 * Super Admin login form. Posts to /api/admin/auth/login which validates
 * against the SUPER_ADMIN_* env credentials and sets a signed session cookie.
 * On success, routes into the operations console.
 */
export function AdminLoginForm() {
  const router = useRouter();
  const [showPw, setShowPw] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message ?? "Login failed.");
      }
      toast.success("Welcome back, Super Admin.");
      router.push("/admin");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Login failed.");
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-[#0f1729]/80 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-900/50">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-white">Super Admin Access</h1>
          <p className="mt-1 text-sm text-slate-400">Restricted platform operations console.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-slate-300">Username</Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="admin@example.com"
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              {...register("username")}
            />
            {errors.username && <p className="text-xs text-rose-400">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="border-white/10 bg-white/5 pr-10 text-white placeholder:text-slate-500"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:brightness-110"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {isSubmitting ? "Verifying..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <Lock className="h-3 w-3" /> Authorized personnel only. All access is audited.
        </p>
      </div>
    </div>
  );
}
