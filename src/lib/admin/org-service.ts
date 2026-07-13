import "server-only";
import { prisma } from "@/lib/prisma";
import type { AdminOrganizationRow, Paginated } from "@/types/admin";

/**
 * Organization analytics. There is no dedicated Organization table yet —
 * organizations are a free-text field on users. This service derives org-level
 * aggregates from user/document data so the admin UI works today, and is the
 * single seam to swap for a real multi-tenant Organization model later without
 * touching the routes or UI.
 */

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "org";
}

export async function listOrganizations(opts: {
  search?: string;
  orgType?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<AdminOrganizationRow>> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));

  // Group users into orgs. For scale this would move to a materialized org
  // table; the grouping is indexed on `organization`.
  const groups = await prisma.user.groupBy({
    by: ["organization", "orgType"],
    _count: { _all: true },
    _min: { createdAt: true },
  });

  const activeGroups = await prisma.user.groupBy({
    by: ["organization"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });
  const activeMap = new Map(activeGroups.map((g) => [g.organization, g._count._all]));

  // Document + storage per organization (join through the owning user).
  const docAgg = await prisma.$queryRawUnsafe<
    Array<{ organization: string; docs: bigint | number; bytes: bigint | number }>
  >(
    `SELECT u.organization AS organization, COUNT(d.id) AS docs, COALESCE(SUM(d.sizeBytes),0) AS bytes
     FROM users u LEFT JOIN documents d ON d.userId = u.id AND d.deletedAt IS NULL
     GROUP BY u.organization`
  );
  const docMap = new Map(
    docAgg.map((r) => [r.organization, { docs: Number(r.docs), bytes: Number(r.bytes) }])
  );

  const aiAgg = await prisma.$queryRawUnsafe<Array<{ organization: string; reqs: bigint | number }>>(
    `SELECT u.organization AS organization, COUNT(a.id) AS reqs
     FROM users u LEFT JOIN ai_request_logs a ON a.userId = u.id
     GROUP BY u.organization`
  );
  const aiMap = new Map(aiAgg.map((r) => [r.organization, Number(r.reqs)]));

  let rows: AdminOrganizationRow[] = groups.map((g) => {
    const docs = docMap.get(g.organization);
    return {
      id: slugify(g.organization),
      name: g.organization,
      orgType: g.orgType,
      userCount: g._count._all,
      activeUserCount: activeMap.get(g.organization) ?? 0,
      documentCount: docs?.docs ?? 0,
      storageBytes: docs?.bytes ?? 0,
      aiRequests: aiMap.get(g.organization) ?? 0,
      createdAt: (g._min.createdAt ?? new Date()).toISOString(),
      status: "ACTIVE",
    };
  });

  if (opts.search) {
    const q = opts.search.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(q));
  }
  if (opts.orgType) rows = rows.filter((r) => r.orgType === opts.orgType);

  rows.sort((a, b) => b.userCount - a.userCount);

  const total = rows.length;
  const items = rows.slice((page - 1) * pageSize, page * pageSize);
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
