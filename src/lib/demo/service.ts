import "server-only";
import { Prisma, DemoEnquiryStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/types/admin";
import type { DemoEnquiryInput } from "@/lib/validations/demo";
import { sendDemoEnquiryThankYouEmail, notifyAdminNewDemoEnquiry } from "@/lib/demo/demo-mailer";

export interface DemoEnquiryRow {
  id: string;
  name: string;
  email: string;
  company: string;
  businessType: string;
  phone: string;
  whatsapp: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  message: string | null;
  status: DemoEnquiryStatus;
  notes: string | null;
  createdAt: string;
}

export interface DemoEnquiryListFilter {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sort?: "createdAt" | "name" | "company";
  order?: "asc" | "desc";
}

function toRow(e: {
  id: string;
  name: string;
  email: string;
  company: string;
  businessType: string;
  phone: string;
  whatsapp: string | null;
  preferredDate: Date | null;
  preferredTime: string | null;
  message: string | null;
  status: DemoEnquiryStatus;
  notes: string | null;
  createdAt: Date;
}): DemoEnquiryRow {
  return {
    id: e.id,
    name: e.name,
    email: e.email,
    company: e.company,
    businessType: e.businessType,
    phone: e.phone,
    whatsapp: e.whatsapp,
    preferredDate: e.preferredDate ? e.preferredDate.toISOString().slice(0, 10) : null,
    preferredTime: e.preferredTime,
    message: e.message,
    status: e.status,
    notes: e.notes,
    createdAt: e.createdAt.toISOString(),
  };
}

function buildWhere(f: DemoEnquiryListFilter): Prisma.DemoEnquiryWhereInput {
  const where: Prisma.DemoEnquiryWhereInput = {};
  if (f.status) where.status = f.status as DemoEnquiryStatus;
  if (f.search) {
    where.OR = [
      { name: { contains: f.search } },
      { email: { contains: f.search } },
      { company: { contains: f.search } },
      { phone: { contains: f.search } },
    ];
  }
  return where;
}

/** List demo enquiries for the admin console, filtered + paged. */
export async function listDemoEnquiries(
  f: DemoEnquiryListFilter
): Promise<Paginated<DemoEnquiryRow> & { counts: Record<string, number> }> {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, f.pageSize ?? 20));
  const where = buildWhere(f);
  const sort = f.sort ?? "createdAt";
  const order = f.order ?? "desc";

  const [total, rows, statusCounts] = await Promise.all([
    prisma.demoEnquiry.count({ where }),
    prisma.demoEnquiry.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.demoEnquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  // Status tallies (across all enquiries, not just this page) for admin tabs.
  const counts: Record<string, number> = { NEW: 0, CONTACTED: 0, SCHEDULED: 0, CLOSED: 0 };
  for (const c of statusCounts) counts[c.status] = c._count._all;

  return {
    items: rows.map(toRow),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    counts,
  };
}

/** Fetch a single enquiry by id. */
export async function getDemoEnquiry(id: string): Promise<DemoEnquiryRow | null> {
  const e = await prisma.demoEnquiry.findUnique({ where: { id } });
  return e ? toRow(e) : null;
}

/** Update an enquiry's triage status and/or internal notes. */
export async function updateDemoEnquiry(
  id: string,
  data: { status?: DemoEnquiryStatus; notes?: string }
): Promise<DemoEnquiryRow> {
  const e = await prisma.demoEnquiry.update({ where: { id }, data });
  return toRow(e);
}

/** Permanently delete an enquiry. Used from the admin console's delete action. */
export async function deleteDemoEnquiry(id: string): Promise<void> {
  await prisma.demoEnquiry.delete({ where: { id } });
}

/**
 * Create a demo enquiry from the public contact form, then fire both
 * notification emails (thank-you to the submitter, alert to the admin) in
 * parallel. Email failures never block the submission — they're logged and
 * swallowed via `Promise.allSettled`.
 */
export async function createDemoEnquiry(
  input: DemoEnquiryInput,
  meta: { ip?: string | null; userAgent?: string | null }
): Promise<DemoEnquiryRow> {
  const preferredDate = input.date ? new Date(input.date) : null;

  const enquiry = await prisma.demoEnquiry.create({
    data: {
      name: input.name,
      email: input.email,
      company: input.company,
      businessType: input.businessType,
      phone: input.phone,
      whatsapp: input.whatsapp || null,
      preferredDate: preferredDate && !Number.isNaN(preferredDate.getTime()) ? preferredDate : null,
      preferredTime: input.time || null,
      message: input.message || null,
      ipAddress: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  const emailPayload = {
    name: input.name,
    email: input.email,
    company: input.company,
    businessType: input.businessType,
    phone: input.phone,
    whatsapp: input.whatsapp || undefined,
    preferredDate: input.date || undefined,
    preferredTime: input.time || undefined,
    message: input.message || undefined,
  };

  const results = await Promise.allSettled([
    sendDemoEnquiryThankYouEmail(emailPayload),
    notifyAdminNewDemoEnquiry(emailPayload),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.error("[demo-enquiry] email failed:", r.reason);
  }

  return toRow(enquiry);
}
