// POST /api/admin/credentials — change admin ID/password (admin session required)
// GET  /api/admin/credentials — read current ID (admin session required; the
//                               password is never returned)

import { NextRequest, NextResponse } from "next/server";
import { throwIfResponse, jsonError, readAdminCreds, writeAdminCreds } from "@/lib/api-utils";
import { verifyAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await verifyAdminRequest();
    if (!admin) return jsonError("Unauthorized", 401);
    const creds = await readAdminCreds();
    return NextResponse.json({ ok: true, username: creds.username });
  } catch (e) {
    throwIfResponse(e);
    console.error("[api/admin/credentials GET]", e);
    return jsonError("Failed to read credentials", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest();
    if (!admin) return jsonError("Unauthorized", 401);
    const { currentPassword, username, password } = (await req.json()) as {
      currentPassword?: string;
      username?: string;
      password?: string;
    };
    if (!currentPassword || !username?.trim()) return jsonError("Current password and new Admin ID are required", 400);
    const creds = await readAdminCreds();
    if (currentPassword !== creds.password) return jsonError("Wrong current password", 401);
    if (password && password.trim().length < 4) return jsonError("New password must be at least 4 characters", 400);
    await writeAdminCreds(username.trim(), password?.trim() || creds.password);
    return NextResponse.json({ ok: true });
  } catch (e) {
    throwIfResponse(e);
    console.error("[api/admin/credentials POST]", e);
    return jsonError("Failed to update credentials", 500);
  }
}
