import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, ErrorCode } from "@/lib/api/response";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import {
  getUserDetail,
  setUserStatus,
  forceLogout,
  resetUserPassword,
  deleteUser,
  updateUserProfile,
} from "@/lib/admin/user-service";
import { adminUpdateUserSchema } from "@/lib/validations/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin actions on a normal portal user. There is no role management here —
 * every signup is a standard user; the only account type change is the
 * lifecycle status (active/suspended).
 */
const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setStatus"), status: z.enum(["ACTIVE", "SUSPENDED"]) }),
  z.object({ action: z.literal("forceLogout") }),
  z.object({ action: z.literal("resetPassword"), password: z.string().min(8).max(200) }),
  z.object({ action: z.literal("updateProfile") }).merge(adminUpdateUserSchema),
]);

/** GET /api/admin/users/:id — full user detail incl. recent sessions. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  const user = await getUserDetail(id);
  if (!user) return fail("User not found.", { status: 404, code: ErrorCode.NOT_FOUND });
  return ok(user, "OK");
}

/** PATCH /api/admin/users/:id — status / password / session actions. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request.", { status: 422, code: ErrorCode.VALIDATION, error: parsed.error.message });
  }
  const input = parsed.data;

  switch (input.action) {
    case "setStatus":
      await setUserStatus(id, input.status);
      break;
    case "forceLogout":
      await forceLogout(id);
      break;
    case "resetPassword":
      await resetUserPassword(id, input.password);
      break;
    case "updateProfile":
      await updateUserProfile(id, {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        organization: input.organization,
        orgType: input.orgType,
        status: input.status,
      });
      break;
  }

  await logAdminAction(req, {
    adminId: guard.user.id,
    action: `user.${input.action}`,
    entity: "User",
    entityId: id,
    metadata:
      input.action === "setStatus"
        ? { status: input.status }
        : input.action === "updateProfile"
          ? { firstName: input.firstName, lastName: input.lastName, organization: input.organization, orgType: input.orgType, status: input.status }
          : {},
  });

  return ok({ id }, "User updated.");
}

/** DELETE /api/admin/users/:id — permanent deletion. */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin({ superAdmin: true });
  if (!guard.ok) return guard.response;
  const { id } = await ctx.params;

  await deleteUser(id);
  await logAdminAction(req, { adminId: guard.user.id, action: "user.delete", entity: "User", entityId: id });
  return ok({ id }, "User deleted.");
}
