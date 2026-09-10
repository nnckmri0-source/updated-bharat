// POST /api/admin/reset-password — send a Firebase password-reset email.
// The email must be in the admin allowlist (anti-abuse). Firebase sends the
// message with a secure link/code; the admin sets the new password there.

import { NextRequest, NextResponse } from "next/server";
import { throwIfResponse, jsonError } from "@/lib/api-utils";
import { ADMIN_READY } from "@/lib/firebase-admin";
import { isEmail, authSendPasswordReset, isEmailAllowlisted } from "@/lib/firebase-auth-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_READY) return jsonError("Firebase Admin not configured", 503);
    const { email } = (await req.json()) as { email?: string };
    if (!email || !isEmail(email)) return jsonError("Valid email required", 400);
    if (!(await isEmailAllowlisted(email))) return jsonError("This email is not an admin", 401);
    const sent = await authSendPasswordReset(email);
    if (sent.ok) return NextResponse.json({ ok: true, message: "Reset link sent — check your inbox (and spam folder)." });
    if (sent.code === "EMAIL_NOT_FOUND") {
      // Allowlisted but never logged in → no Auth account yet; first login creates it.
      return NextResponse.json({ ok: true, message: "No account exists yet for this email — log in once with your password to create it." });
    }
    if (sent.code === "OPERATION_NOT_ALLOWED") {
      return jsonError("Email login is not enabled yet — Firebase Console → Authentication → enable Email/Password", 503);
    }
    return jsonError(`Could not send reset email (${sent.code})`, 500);
  } catch (e) {
    throwIfResponse(e);
    console.error("[api/admin/reset-password POST]", e);
    return jsonError("Failed to send reset email", 500);
  }
}
