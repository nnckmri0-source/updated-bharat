// POST /api/admin/login — verify admin credentials and issue a session cookie
// GET /api/admin/login — session check for the panel (returns { authed, username })
// DELETE /api/admin/login — logout (clears the cookie)
// ----------------------------------------------------------------------------
// Two login methods:
//   { username, password } — legacy Admin ID + password (private DB node)
//   { email, password }    — Firebase Auth login; email must be in the admin
//                            allowlist. First login for an allowlisted email
//                            creates the Auth account with the given password.
// The session cookie is HttpOnly + HMAC-signed and is what authorizes all
// /api/site writes and admin-only endpoints.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { throwIfResponse, jsonError } from "@/lib/api-utils";
import { ADMIN_READY } from "@/lib/firebase-admin";
import {
  checkAdminCredentials,
  createSessionToken,
  verifyAdminRequest,
  ADMIN_COOKIE,
} from "@/lib/admin-auth";
import { isEmail, authPasswordSignIn, authSignUp, isEmailAllowlisted } from "@/lib/firebase-auth-server";

export const dynamic = "force-dynamic";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function GET() {
  const session = await verifyAdminRequest();
  return NextResponse.json({ ok: true, authed: Boolean(session), username: session?.username ?? null });
}

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_READY) {
      return jsonError("Firebase Admin not configured — see .env.local", 503);
    }
    const { username, email, password } = (await req.json()) as {
      username?: string;
      email?: string;
      password?: string;
    };
    if (!password) return jsonError("Password required", 400);

    let displayName: string | null = null;

    if (email && isEmail(email)) {
      // ----- Firebase Auth email login -----
      if (!(await isEmailAllowlisted(email))) return jsonError("This email is not an admin — ask the owner to add it", 401);
      const signIn = await authPasswordSignIn(email, password);
      if (signIn.ok) {
        displayName = email.trim().toLowerCase();
      } else if (signIn.code === "EMAIL_NOT_FOUND") {
        // First login for an allowlisted email → create the account.
        const signUp = await authSignUp(email, password);
        if (signUp.ok) displayName = email.trim().toLowerCase();
        else if (signUp.code === "WEAK_PASSWORD") return jsonError("Password must be at least 6 characters", 401);
        else return jsonError("Login failed — try again", 401);
      } else if (signIn.code === "INVALID_PASSWORD" || signIn.code === "INVALID_LOGIN_CREDENTIALS") {
        return jsonError("Wrong email or password", 401);
      } else if (signIn.code === "OPERATION_NOT_ALLOWED") {
        return jsonError("Email login is not enabled yet — Firebase Console → Authentication → enable Email/Password", 503);
      } else if (signIn.code === "MISSING_API_KEY") {
        return jsonError("Server missing NEXT_PUBLIC_FIREBASE_API_KEY", 503);
      } else {
        return jsonError(`Login failed (${signIn.code})`, 401);
      }
    } else if (username) {
      // ----- Legacy Admin ID + password -----
      displayName = await checkAdminCredentials(username, password);
    } else {
      return jsonError("Admin ID / email and password required", 400);
    }

    if (!displayName) return jsonError("Invalid credentials", 401);

    const store = await cookies();
    store.set(ADMIN_COOKIE, createSessionToken(displayName), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    });
    return NextResponse.json({ ok: true, username: displayName });
  } catch (e) {
    throwIfResponse(e);
    console.error("[api/admin/login POST]", e);
    return jsonError("Login failed", 500);
  }
}

export async function DELETE() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
