"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { OtpModal } from "@/components/landing/auth/otp-modal";
import { PlanSelect } from "@/components/landing/auth/plan-select";
import { COUNTRIES } from "@/constants/countries";
import { PLAN_KEYS, formatPlanPrice, type PublicPlan } from "@/lib/plans/types";
import { cn } from "@/lib/utils";

const orgTypes = [
  "Law Firm",
  "Chartered Accountant",
  "Company Secretary",
  "Tax Consultant",
  "Corporate Legal Team",
  "Bank / NBFC",
  "Government",
  "Startup",
  "Other",
] as const;

const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    phone: z
      .string()
      .min(7, "Enter a valid phone number.")
      .regex(/^[+\d][\d\s()-]{6,}$/, "Enter a valid phone number."),
    email: z.string().email("Please enter a valid work email."),
    organization: z.string().min(2, "Please enter your organization."),
    orgType: z.enum(orgTypes, {
      errorMap: () => ({ message: "Please select an organization type." }),
    }),
    designation: z.string().min(2, "Please enter your designation."),
    country: z.string().min(2, "Please select your country."),
    plan: z.enum(PLAN_KEYS, { errorMap: () => ({ message: "Please select a plan." }) }),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Z]/, "Include an uppercase letter.")
      .regex(/[0-9]/, "Include a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupValues = z.infer<typeof signupSchema>;

const checks = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
];

const fieldClass = "h-9 text-[13px]";
const labelClass = "text-xs";
const errorClass = "text-[11px] text-destructive";

export function SignupForm({ plans }: { plans: PublicPlan[] }) {
  const router = useRouter();
  const [step, setStep] = React.useState<"plan" | "details">("plan");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [otpOpen, setOtpOpen] = React.useState(false);
  const [pendingEmail, setPendingEmail] = React.useState("");
  const [requiresApproval, setRequiresApproval] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      plan: (plans.find((p) => p.isPopular)?.key ?? plans[0]?.key) as SignupValues["plan"],
    },
  });

  const password = watch("password") ?? "";
  const selectedPlanKey = watch("plan");
  const selectedPlan = plans.find((p) => p.key === selectedPlanKey) ?? null;

  const onSubmit = async (values: SignupValues) => {
    setFormError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          Object.entries(data.fieldErrors).forEach(([key, msgs]) => {
            const message = Array.isArray(msgs) ? msgs[0] : String(msgs);
            setError(key as keyof SignupValues, { message });
          });
        }
        setFormError(data.error ?? "Sign up failed. Please try again.");
        return;
      }

      setPendingEmail(values.email);
      setRequiresApproval(Boolean(data.requiresApproval));
      setOtpOpen(true);
    } catch {
      setFormError("Network error. Please try again.");
    }
  };

  if (step === "plan") {
    return (
      <div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Choose your plan
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Start free, or pick a plan that fits your team. You can change this later.
          </p>
        </div>

        <div className="mt-6">
          <PlanSelect
            plans={plans}
            value={selectedPlanKey ?? null}
            onChange={(key) => setValue("plan", key as SignupValues["plan"], { shouldValidate: true })}
          />
          {errors.plan && <p className={cn(errorClass, "mt-2")}>{errors.plan.message}</p>}
        </div>

        <Button
          type="button"
          className="mt-6 h-10 w-full"
          disabled={!selectedPlanKey}
          onClick={() => setStep("details")}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setStep("plan")}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to plans
      </button>

      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Start turning documents into insights in minutes.
        </p>
      </div>

      {selectedPlan && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <div className="text-[13px]">
            <span className="font-semibold text-foreground">{selectedPlan.name} plan</span>
            <span className="ml-2 text-muted-foreground">
              {formatPlanPrice(selectedPlan.priceMonthly, selectedPlan.currency)}
              {selectedPlan.priceMonthly > 0 && " / mo"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStep("plan")}
            className="text-[12px] font-medium text-primary hover:underline"
          >
            Change
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName" className={labelClass}>First name</Label>
            <Input id="firstName" placeholder="Aarav" className={fieldClass} {...register("firstName")} />
            {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName" className={labelClass}>Last name</Label>
            <Input id="lastName" placeholder="Sharma" className={fieldClass} {...register("lastName")} />
            {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email" className={labelClass}>Work email</Label>
            <Input id="email" type="email" placeholder="aarav@firm.co.in" className={fieldClass} {...register("email")} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className={labelClass}>Mobile number</Label>
            <Input id="phone" type="tel" placeholder="+91 98765 43210" className={fieldClass} {...register("phone")} />
            {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="organization" className={labelClass}>Organization name</Label>
            <Input id="organization" placeholder="Sharma & Associates" className={fieldClass} {...register("organization")} />
            {errors.organization && <p className={errorClass}>{errors.organization.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="designation" className={labelClass}>Designation</Label>
            <Input id="designation" placeholder="Managing Partner" className={fieldClass} {...register("designation")} />
            {errors.designation && <p className={errorClass}>{errors.designation.message}</p>}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="orgType" className={labelClass}>Organization type</Label>
            <Select id="orgType" defaultValue="" className={fieldClass} {...register("orgType")}>
              <option value="" disabled>Select type</option>
              {orgTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
            {errors.orgType && <p className={errorClass}>{errors.orgType.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country" className={labelClass}>Country</Label>
            <Select id="country" defaultValue="" className={fieldClass} {...register("country")}>
              <option value="" disabled>Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            {errors.country && <p className={errorClass}>{errors.country.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className={labelClass}>Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
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
          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
            {checks.map((check) => {
              const passed = check.test(password);
              return (
                <span
                  key={check.label}
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] transition-colors",
                    passed ? "text-success" : "text-muted-foreground"
                  )}
                >
                  <Check className="h-3 w-3" />
                  {check.label}
                </span>
              );
            })}
          </div>
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className={labelClass}>Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter your password"
              className={`${fieldClass} pr-10`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword.message}</p>}
        </div>

        {formError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <Button type="submit" size="sm" className="h-10 w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href="/resources" className="font-medium text-primary hover:underline">Terms</Link>{" "}
          and{" "}
          <Link href="/resources" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-primary hover:underline">Sign in</Link>
      </p>

      <OtpModal
        open={otpOpen}
        email={pendingEmail}
        onClose={() => setOtpOpen(false)}
        onVerified={() => {
          setOtpOpen(false);
          router.push(requiresApproval ? "/pending" : "/signin");
          router.refresh();
        }}
      />
    </div>
  );
}
