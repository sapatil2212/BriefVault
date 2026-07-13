import { NextRequest } from "next/server";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { rateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { demoEnquirySchema } from "@/lib/validations/demo";
import { createDemoEnquiry } from "@/lib/demo/service";

export const runtime = "nodejs";

/**
 * POST /api/contact
 * Public "Book a demo" / contact form submission. Persists the enquiry so it
 * shows up in the admin "Demo Enquiries" console, then sends a thank-you email
 * to the submitter and an alert email to the platform admin (both best-effort,
 * never blocking the response).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`contact:${ip}`, 5, 60 * 15);
  if (!limit.success) {
    return fail("Too many requests. Please try again later.", {
      status: 429,
      code: ErrorCode.RATE_LIMIT,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  const parsed = demoEnquirySchema.safeParse(body);
  if (!parsed.success) {
    return fail("Please check the form and try again.", {
      status: 422,
      code: ErrorCode.VALIDATION,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    });
  }

  try {
    const enquiry = await createDemoEnquiry(parsed.data, {
      ip,
      userAgent: req.headers.get("user-agent"),
    });
    return ok({ id: enquiry.id }, "Demo request received.", { status: 201 });
  } catch (err) {
    console.error("[contact] failed to create demo enquiry:", err);
    return fail("Something went wrong. Please try again.", {
      status: 500,
      code: ErrorCode.INTERNAL,
    });
  }
}
