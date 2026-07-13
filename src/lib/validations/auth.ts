import { z } from "zod";
import { PLAN_KEYS } from "@/lib/plans/types";

export const ORG_TYPES = [
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

export type OrgTypeLabel = (typeof ORG_TYPES)[number];

/** Map human labels to the Prisma OrgType enum values. */
export const ORG_TYPE_ENUM: Record<OrgTypeLabel, string> = {
  "Law Firm": "LAW_FIRM",
  "Chartered Accountant": "CHARTERED_ACCOUNTANT",
  "Company Secretary": "COMPANY_SECRETARY",
  "Tax Consultant": "TAX_CONSULTANT",
  "Corporate Legal Team": "CORPORATE_LEGAL_TEAM",
  "Bank / NBFC": "BANK_NBFC",
  Government: "GOVERNMENT",
  Startup: "STARTUP",
  Other: "OTHER",
};

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.");

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(60),
    lastName: z.string().trim().min(1, "Last name is required.").max(60),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number.")
      .regex(/^[+\d][\d\s()-]{6,}$/, "Enter a valid phone number."),
    email: z.string().trim().toLowerCase().email("Please enter a valid work email."),
    organization: z.string().trim().min(2, "Please enter your organization.").max(120),
    orgType: z.enum(ORG_TYPES, {
      errorMap: () => ({ message: "Please select an organization type." }),
    }),
    designation: z.string().trim().min(2, "Please enter your designation.").max(80),
    country: z.string().trim().min(2, "Please select your country.").max(80),
    plan: z.enum(PLAN_KEYS, {
      errorMap: () => ({ message: "Please select a plan." }),
    }),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
  remember: z.boolean().optional(),
});

export type SigninInput = z.infer<typeof signinSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

/** Profile fields a user can edit (email is intentionally immutable here). */
export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(60),
  lastName: z.string().trim().min(1, "Last name is required.").max(60),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .regex(/^[+\d][\d\s()-]{6,}$/, "Enter a valid phone number."),
  organization: z.string().trim().min(2, "Please enter your organization.").max(120),
  orgType: z.enum(ORG_TYPES, {
    errorMap: () => ({ message: "Please select an organization type." }),
  }),
  designation: z.string().trim().min(2, "Please enter your designation.").max(80).optional().or(z.literal("")),
  country: z.string().trim().min(2, "Please select your country.").max(80).optional().or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/** Raw Prisma `OrgType` enum values (distinct from the signup form's human labels). */
export const ORG_TYPE_VALUES = [
  "LAW_FIRM",
  "CHARTERED_ACCOUNTANT",
  "COMPANY_SECRETARY",
  "TAX_CONSULTANT",
  "CORPORATE_LEGAL_TEAM",
  "BANK_NBFC",
  "GOVERNMENT",
  "STARTUP",
  "OTHER",
] as const;

/**
 * Admin edit of a user's profile fields + lifecycle status, from the console.
 * Unlike the signup form (which uses human labels mapped via `ORG_TYPE_ENUM`),
 * this operates directly on the stored Prisma enum values since that's what
 * the admin table already displays and the DB already holds.
 */
export const adminUpdateUserSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(60),
  lastName: z.string().trim().min(1, "Last name is required.").max(60),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .regex(/^[+\d][\d\s()-]{6,}$/, "Enter a valid phone number."),
  organization: z.string().trim().min(2, "Please enter the organization.").max(120),
  orgType: z.enum(ORG_TYPE_VALUES, {
    errorMap: () => ({ message: "Please select an organization type." }),
  }),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
