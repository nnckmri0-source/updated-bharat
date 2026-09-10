// Admin email allowlist management (admin session required)
// GET  /api/admin/emails — list allowlisted admin emails
// POST /api/admin/emails — { email, allowed: boolean } add/remove

import { NextRequest, NextResponse } from "next/server";
import { throwIfResponse, jsonError } from "@/lib/api-utils";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { isEmail, listAllowlistedEmails, setEmailAllowlisted } from "@/lib/firebase-auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await verifyAdminRequest();
    if (!admin) return jsonError("Unauthorized", 401);
    return NextResponse.json({ ok: true, emails: await listAllowlistedEmails() });
  } catch (e) {
    throwIfResponse(e);
    console.error("[api/admin/emails GET]", e);
    return jsonError("Failed to read admin emails", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest();
    if (!admin) return jsonError("Unauthorized", 401);
    const { email, allowed } = (await req.json()) as { email?: string; allowed?: boolean };
    if (!email || !isEmail(email)) return jsonError("Valid email required", 400);
    await setEmailAllowlisted(email, allowed !== false);
    return NextResponse.json({ ok: true, emails: await listAllowlistedEmails() });
  } catch (e) {
    throwIfResponse(e);
    console.error("[api/admin/emails POST]", e);
    return jsonError("Failed to update admin emails", 500);
  }
}
