"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Building,
  Briefcase,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  Check,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid work email is required"),
  company: z.string().min(2, "Company name is required"),
  businessType: z.string().min(1, "Please select a business type"),
  phone: z.string().min(8, "Valid contact number is required"),
  whatsapp: z.string().optional(),
  date: z.string().min(1, "Please choose a date"),
  time: z.string().min(1, "Please choose a time"),
  message: z.string().optional(),
});

type ContactValues = z.infer<typeof contactSchema>;

const TIME_SLOTS = [
  "10:00 AM IST",
  "11:30 AM IST",
  "02:00 PM IST",
  "03:30 PM IST",
  "05:00 PM IST",
  "06:30 PM IST",
];

const BUSINESS_TYPES = [
  "Law Firm / Independent Practice",
  "Corporate Legal Dept",
  "Chartered Accountant / Tax Consultant",
  "Company Secretary",
  "Enterprise / Finance / NBFC",
  "Startup Founder / Management",
  "Other",
];

export function ContactForm() {
  const [succeeded, setSucceeded] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      businessType: "Law Firm / Independent Practice",
      time: TIME_SLOTS[0],
    },
  });

  const onSubmit = async (values: ContactValues) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.message ?? "Something went wrong. Please try again.");
      }
      reset();
      setSucceeded(true);
      setTimeout(() => setSucceeded(false), 5000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  // Min date today
  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Row 1: Name & Work Email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <IconField
          label="Full Name"
          htmlFor="name"
          icon={User}
          error={errors.name?.message}
        >
          <input
            id="name"
            type="text"
            placeholder="Enter name"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register("name")}
          />
        </IconField>

        <IconField
          label="Work Email"
          htmlFor="email"
          icon={Mail}
          error={errors.email?.message}
        >
          <input
            id="email"
            type="email"
            placeholder="Enter business email"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register("email")}
          />
        </IconField>
      </div>

      {/* Row 2: Company Name & Business Type */}
      <div className="grid gap-4 sm:grid-cols-2">
        <IconField
          label="Company Name"
          htmlFor="company"
          icon={Building}
          error={errors.company?.message}
        >
          <input
            id="company"
            type="text"
            placeholder="Enter company name"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register("company")}
          />
        </IconField>

        <IconField
          label="Business Type"
          htmlFor="businessType"
          icon={Briefcase}
          error={errors.businessType?.message}
          isSelect
        >
          <select
            id="businessType"
            className="w-full appearance-none rounded-xl border border-border bg-background py-2.5 pl-10 pr-9 text-xs text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            {...register("businessType")}
          >
            {BUSINESS_TYPES.map((bt) => (
              <option key={bt} value={bt}>
                {bt}
              </option>
            ))}
          </select>
        </IconField>
      </div>

      {/* Row 3: Contact Number & WhatsApp Number */}
      <div className="grid gap-4 sm:grid-cols-2">
        <IconField
          label="Contact Number*"
          htmlFor="phone"
          icon={Phone}
          error={errors.phone?.message}
        >
          <input
            id="phone"
            type="tel"
            placeholder="Enter contact number"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register("phone")}
          />
        </IconField>

        <IconField
          label="WhatsApp Number"
          optional
          htmlFor="whatsapp"
          icon={MessageSquare}
          error={errors.whatsapp?.message}
        >
          <input
            id="whatsapp"
            type="tel"
            placeholder="Enter WhatsApp number (optional)"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register("whatsapp")}
          />
        </IconField>
      </div>

      {/* Row 4: Choose a Date & Choose a Time */}
      <div className="grid gap-4 sm:grid-cols-2">
        <IconField
          label="Choose a date"
          htmlFor="date"
          icon={Calendar}
          error={errors.date?.message}
        >
          <input
            id="date"
            type="date"
            min={today}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3.5 text-xs text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            {...register("date")}
          />
        </IconField>

        <IconField
          label="Choose a time"
          htmlFor="time"
          icon={Clock}
          error={errors.time?.message}
          isSelect
        >
          <select
            id="time"
            className="w-full appearance-none rounded-xl border border-border bg-background py-2.5 pl-10 pr-9 text-xs text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            {...register("time")}
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </IconField>
      </div>

      {/* Anything else we should know? */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="message" className="text-xs font-semibold text-foreground">
            Anything else we should know?
          </label>
          <span className="text-[11px] text-muted-foreground/70">optional</span>
        </div>
        <textarea
          id="message"
          rows={3}
          placeholder="Tell us about your team size, document volume, or specific use cases..."
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          {...register("message")}
        />
      </div>

      {/* Submit Button */}
      {submitError && (
        <p className="text-xs font-medium text-destructive animate-in fade-in-50">{submitError}</p>
      )}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || succeeded}
          className={cn(
            "w-full h-12 rounded-xl text-sm font-bold text-primary-foreground transition-all shadow-md hover:opacity-95",
            succeeded
              ? "bg-emerald-600 hover:bg-emerald-600 text-white"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming Slot…
            </>
          ) : succeeded ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Demo Requested — Check your email soon!
            </>
          ) : (
            "Book My Demo"
          )}
        </Button>
      </div>
    </form>
  );
}

function IconField({
  label,
  optional,
  htmlFor,
  icon: Icon,
  error,
  children,
  isSelect,
}: {
  label: string;
  optional?: boolean;
  htmlFor: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
  children: React.ReactNode;
  isSelect?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-xs font-semibold text-foreground">
          {label}
        </label>
        {optional && (
          <span className="text-[11px] text-muted-foreground/70">optional</span>
        )}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/75 z-10">
          <Icon className="h-4 w-4" />
        </span>
        {children}
        {isSelect && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/75 z-10">
            <ChevronDown className="h-4 w-4" />
          </span>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-medium text-destructive animate-in fade-in-50">
          {error}
        </p>
      )}
    </div>
  );
}
