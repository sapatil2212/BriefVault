import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { getProviders, getProviderHealth } from "@/lib/admin/providers-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/providers — AI provider inventory + 24h health. */
export async function GET(_req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const [providers, health] = await Promise.all([getProviders(), getProviderHealth()]);
  return ok({ providers, health }, "OK");
}
