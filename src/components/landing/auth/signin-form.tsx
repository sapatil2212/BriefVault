"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const signinSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  remember: z.boolean().optional(),
});

type SigninValues = z.infer<typeof signinSchema>;

const fieldClass = "h-9 text-[13px]";
const labelClass = "text-xs";

export function SigninForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [succeeded, setSucceeded] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninValues>({ resolver: zodResolver(signinSchema) });

  const onSubmit = async (values: SigninValues) => {
    setFormError(null);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        // Account-status codes route to their dedicated screen instead of
        // showing an inline error.
        const statusRoutes: Record<string, string> = {
          PENDING: "/pending",
          REJECTED: "/rejected",
          SUSPENDED: "/suspended",
        };
        const route = data.code ? statusRoutes[data.code] : undefined;
        if (route) {
          router.push(route);
          return;
        }
        setFormError(data.error ?? "Sign in failed. Please try again.");
        return;
      }

      setSucceeded(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 900);
    } catch {
      setFormError("Network error. Please try again.");
    }
  };

  return (
    <div>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Sign in to BriefVault
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Welcome back. Enter your details to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3.5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email" className={labelClass}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@firm.co.in"
            className={fieldClass}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-[11px] text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className={labelClass}>
              Password
            </Label>
            <Link
              href="/signin"
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`${fieldClass} pr-10`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-destructive">{errors.password.message}</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <input
            type="checkbox"
            {...register("remember")}
            className="h-3.5 w-3.5 rounded border-input text-primary accent-primary"
          />
          Remember me
        </label>

        {formError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <Button
          type="submit"
          size="sm"
          className={cn(
            "h-10 w-full",
            succeeded && "bg-success text-success-foreground hover:bg-success"
          )}
          disabled={isSubmitting || succeeded}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : succeeded ? (
            <>
              <Check className="h-4 w-4" />
              Signed in
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Get started
        </Link>
      </p>
    </div>
  );
}
