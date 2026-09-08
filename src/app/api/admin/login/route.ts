// POST /api/admin/login — verify admin ID + password against Firebase
// GET /api/admin/login — session check for the panel (returns { authed, username })

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { throwIfResponse, jsonError } from "@/lib/api-utils";
import { ADMIN_READY } from "@/lib/firebase-admin";
import { checkAdminCredentials, createSessionToken, verifyAdminRequest, ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifyAdminRequest();
  return NextResponse.json({ ok: true, authed: Boolean(session), username: session?.username ?? null });
}

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_READY) {
      return jsonError("Firebase Admin not configured — see .env.local", 503);
    }
    const { username, password } = (await req.json()) as { username?: string; password?: string };
    if (!username || !password) return jsonError("Username and password required", 400);
    const valid = await checkAdminCredentials(username, password);
    if (!valid) return jsonError("Invalid credentials", 401);
    const store = await cookies();
    store.set(ADMIN_COOKIE, createSessionToken(valid), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ADMIN_COOKIE_MAX_AGE,
      path: "/",
    });
    return NextResponse.json({ ok: true, username: valid });
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
