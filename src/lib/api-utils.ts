// Shared helpers for /api/* route handlers (server-side only).

import { NextResponse } from "next/server";
import { ADMIN_READY, getAdminDb, getAdminApp } from "@/lib/firebase-admin";
import { buildDefaults, type SiteData } from "@/lib/site-data";

export const SITE_NODE = "site";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Throws a 503 if Firebase Admin isn't configured. Returns the admin RTDB. */
export function requireDb() {
  if (!ADMIN_READY) {
    throw new Response(
      JSON.stringify({
        ok: false,
        error:
          "Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT (or FIREBASE_SERVICE_ACCOUNT_PATH) and FIREBASE_DATABASE_URL in .env.local, then restart `npm run dev`.",
      }),
      { status: 503, headers: { "content-type": "application/json" } }
    );
  }
  return getAdminDb();
}

/** Convert a thrown Response into a real error for Next's handler wrapper. */
export function throwIfResponse(v: unknown): asserts v is Exclude<typeof v, Response> {
  if (v instanceof Response) throw v;
}

/**
 * Make a document safe for RTDB writes: strip every `undefined` value
 * (RTDB rejects them) and remove undefined/null holes inside arrays so
 * they don't turn into gaps. Object-level nulls are kept (they clear fields).
 */
export function rtdbSafe<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== undefined)
      .map((v) => rtdbSafe(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = rtdbSafe(v);
    }
    return out as T;
  }
  return value;
}

/** Read the whole site document from RTDB, seeding defaults if the node is empty. */
export async function readSiteDoc(): Promise<SiteData> {
  const db = requireDb();
  const siteRef = db.ref(SITE_NODE);
  const snap = await siteRef.get();
  const remote = (snap.val() as Partial<SiteData> | null) ?? null;
  if (!remote || !remote.news?.length) {
    const seed = rtdbSafe(buildDefaults());
    await siteRef.set(seed);
    return seed;
  }
  // Re-merge over defaults so newly added default fields always exist.
  const defaults = buildDefaults();
  return {
    ...defaults,
    ...remote,
    settings: { ...defaults.settings, ...(remote.settings ?? {}) },
    home: { ...defaults.home, ...(remote.home ?? {}) },
    footer: { ...defaults.footer, ...(remote.footer ?? {}) },
  };
}

/** Write the whole site document to RTDB. */
export async function writeSiteDoc(data: SiteData): Promise<void> {
  const db = requireDb();
  await db.ref(SITE_NODE).set(rtdbSafe(data));
}

export { getAdminApp };
