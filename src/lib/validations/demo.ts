import { z } from "zod";

/** Validation for the public "Book a demo" / contact form submission. */
export const demoEnquirySchema = z.object({
  name: z.string().trim().min(2, "Full name is required.").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email."),
  company: z.string().trim().min(2, "Company name is required.").max(160),
  businessType: z.string().trim().min(1, "Please select a business type.").max(80),
  phone: z.string().trim().min(8, "Please enter a valid contact number.").max(30),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  date: z.string().trim().max(20).optional().or(z.literal("")),
  time: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type DemoEnquiryInput = z.infer<typeof demoEnquirySchema>;

/** Validation for the admin "update enquiry" action (status + internal notes). */
export const updateDemoEnquirySchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "SCHEDULED", "CLOSED"]).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type UpdateDemoEnquiryInput = z.infer<typeof updateDemoEnquirySchema>;
