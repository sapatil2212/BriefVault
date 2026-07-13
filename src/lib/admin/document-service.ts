import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminDocumentRow, Paginated } from "@/types/admin";

/** Cross-tenant document monitoring for the admin console. */
export async function listAllDocuments(opts: {
  search?: string;
  status?: string;
  kind?: string;
  organization?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<AdminDocumentRow>> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));

  const where: Prisma.DocumentWhereInput = { deletedAt: null };
  if (opts.status) where.status = opts.status as Prisma.DocumentWhereInput["status"];
  if (opts.kind) where.kind = opts.kind as Prisma.DocumentWhereInput["kind"];
  if (opts.search) where.title = { contains: opts.search };
  if (opts.organization) where.user = { organization: opts.organization };

  const [total, rows] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        kind: true,
        status: true,
        sizeBytes: true,
        pageCount: true,
        createdAt: true,
        user: { select: { email: true, firstName: true, lastName: true, organization: true } },
      },
    }),
  ]);

  const items: AdminDocumentRow[] = rows.map((d) => ({
    id: d.id,
    title: d.title,
    kind: d.kind,
    status: d.status,
    ownerEmail: d.user.email,
    ownerName: `${d.user.firstName} ${d.user.lastName}`.trim(),
    organization: d.user.organization,
    sizeBytes: d.sizeBytes,
    pageCount: d.pageCount,
    createdAt: d.createdAt.toISOString(),
  }));

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Status distribution for the monitoring header cards. */
export async function documentStatusCounts() {
  const groups = await prisma.document.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  const map: Record<string, number> = { UPLOADED: 0, PROCESSING: 0, READY: 0, FAILED: 0 };
  for (const g of groups) map[g.status] = g._count._all;
  return map;
}

/** Re-enqueue a failed document by resetting it to UPLOADED for the worker. */
export async function retryDocument(id: string) {
  return prisma.document.update({
    where: { id },
    data: { status: "UPLOADED", errorMessage: null },
  });
}
