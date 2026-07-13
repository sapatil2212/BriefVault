import "server-only";
import type { NextRequest } from "next/server";
import { logAudit } from "@/lib/audit/service";

/**
 * Admin-scoped audit wrapper. Every mutating admin action funnels through here
 * so the audit trail consistently records the acting admin, the affected
 * entity, and request context (IP / user-agent). Prefixes actions with
 * `admin.` to make platform-operator activity trivially filterable.
 */
export async function logAdminAction(
  req: NextRequest,
  input: {
    adminId: string;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  await logAudit({
    userId: input.adminId,
    action: input.action.startsWith("admin.") ? input.action : `admin.${input.action}`,
    entity: input.entity,
    entityId: input.entityId ?? null,
    metadata: {
      ...input.metadata,
      ipAddress,
      userAgent,
      via: "admin-console",
    },
  });
}
