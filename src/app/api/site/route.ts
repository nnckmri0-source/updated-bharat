// GET /api/site — full site document (public, visitors + admin panel hydration)
// PUT /api/site — replace the whole site document (admin only)
// PATCH /api/site — merge a partial document (shallow merge for settings/home/footer)

import { NextRequest, NextResponse } from "next/server";
import { readSiteDoc, writeSiteDoc, throwIfResponse, stripCredentials, applyServerOwnedFields } from "@/lib/api-utils";
import { verifyAdminRequest } from "@/lib/admin-auth";
import type { SiteData } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const doc = await readSiteDoc();
    // Admin credentials are secrets — never sent through the public API.
    return NextResponse.json({ ok: true, data: stripCredentials(doc) });
  } catch (e) {
    throwIfResponse(e);
    console.error("[api/site GET]", e);
    return NextResponse.json({ ok: false, error: "Failed to read site data" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest();
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = (await req.json()) as SiteData;
    if (!body || !Array.isArray(body.news) || !body.settings) {
      return NextResponse.json({ ok: false, error: "Invalid site document" }, { status: 400 });
    }
    // The client can never set the admin credentials — server-owned fields.
    await writeSiteDoc(applyServerOwnedFields(body));
    return NextResponse.json({ ok: true });
  } catch (e) {
    throwIfResponse(e);
    console.error("[api/site PUT]", e);
    return NextResponse.json({ ok: false, error: "Failed to save site data" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest();
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const partial = (await req.json()) as Partial<SiteData>;
    const current = await readSiteDoc();
    const next: SiteData = {
      ...current,
      ...partial,
      settings: { ...current.settings, ...(partial.settings ?? {}), adminUsername: current.settings.adminUsername, adminPassword: current.settings.adminPassword },
      home: { ...current.home, ...(partial.home ?? {}) },
      footer: { ...current.footer, ...(partial.footer ?? {}) },
    };
    await writeSiteDoc(next);
    return NextResponse.json({ ok: true, data: stripCredentials(next) });
  } catch (e) {
    throwIfResponse(e);
    console.error("[api/site PATCH]", e);
    return NextResponse.json({ ok: false, error: "Failed to save site data" }, { status: 500 });
  }
}
