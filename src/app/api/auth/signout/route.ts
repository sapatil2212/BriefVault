import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { clearAdminSessionCookie } from "@/lib/admin/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    await destroySession();
    // Also clear any env-based super-admin session so logout is complete.
    await clearAdminSessionCookie();
  } catch (err) {
    console.error("[signout] error:", err);
  }
  return NextResponse.json({ message: "Signed out." }, { status: 200 });
}
