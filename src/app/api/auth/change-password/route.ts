import { NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { passwordSchema } from "@/lib/validations/auth";
import { ok, fail, ErrorCode } from "@/lib/api/response";

export const runtime = "nodejs";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match.",
    path: ["confirmNewPassword"],
  });

/** POST /api/auth/change-password — update the signed-in user's password. */
export async function POST(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) {
    return fail("Authentication required.", {
      status: 401,
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body.", { status: 400, code: ErrorCode.VALIDATION });
  }

  try {
    const input = changePasswordSchema.parse(body);

    // Fetch full user record to retrieve current password hash
    const user = await prisma.user.findUnique({
      where: { id: current.id },
    });

    if (!user) {
      return fail("User not found.", { status: 404, code: ErrorCode.NOT_FOUND });
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return fail("Incorrect current password.", {
        status: 400,
        code: ErrorCode.VALIDATION,
        error: "Incorrect current password.",
      });
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(input.newPassword);

    // Update password in DB
    await prisma.user.update({
      where: { id: current.id },
      data: { passwordHash: newPasswordHash },
    });

    return ok(null, "Password updated successfully.");
  } catch (err) {
    if (err instanceof ZodError) {
      return fail("Please check your passwords.", {
        status: 422,
        code: ErrorCode.VALIDATION,
        error: err.issues.map((i) => i.message).join("; "),
      });
    }
    console.error("[auth/change-password POST] error:", err);
    return fail("Failed to update password.", { status: 500, code: ErrorCode.INTERNAL });
  }
}
