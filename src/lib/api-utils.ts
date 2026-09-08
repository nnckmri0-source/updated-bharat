// Shared helpers for /api/* route handlers (server-side only).

import { NextResponse } from "next/server";
import { ADMIN_READY, getAdminDb, getAdminApp } from "@/lib/firebase-admin";
import { buildDefaults, type SiteData } from "@/lib/site-data";

export const SITE_NODE = "site";
// Admin credentials live OUTSIDE the site document — the site node is publicly
// readable (realtime visitor updates), so it must NEVER contain secrets.
export const ADMIN_CREDS_NODE = "admin-credentials";

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

/** Admin ID/password — stored in a private node only the Admin SDK can read. */
export async function readAdminCreds(): Promise<{ username: string; password: string }> {
  const db = requireDb();
  const snap = await db.ref(ADMIN_CREDS_NODE).get();
  const val = snap.val() as { username?: string; password?: string } | null;
  if (val?.username && val?.password) return { username: val.username, password: val.password };
  const d = buildDefaults();
  const creds = { username: d.settings.adminUsername, password: d.settings.adminPassword };
  await db.ref(ADMIN_CREDS_NODE).set(creds);
  return creds;
}

export async function writeAdminCreds(username: string, password: string): Promise<void> {
  const db = requireDb();
  await db.ref(ADMIN_CREDS_NODE).set({ username, password });
}

/**
 * Read the whole site document from RTDB, seeding defaults if the node is
 * empty. Also one-time migrates credentials OUT of the site node (older seeds
 * stored them in site/settings) into the private admin-credentials node.
 */
export async function readSiteDoc(): Promise<SiteData> {
  const db = requireDb();
  const siteRef = db.ref(SITE_NODE);
  const snap = await siteRef.get();
  const remote = (snap.val() as Partial<SiteData> | null) ?? null;
  if (!remote || !remote.news?.length) {
    const seed = rtdbSafe(buildDefaults());
    // Never seed credentials into the public site node.
    seed.settings.adminUsername = "";
    seed.settings.adminPassword = "";
    await siteRef.set(seed);
    const credsSnap = await db.ref(ADMIN_CREDS_NODE).get();
    if (!credsSnap.exists()) {
      const d = buildDefaults();
      await db.ref(ADMIN_CREDS_NODE).set({ username: d.settings.adminUsername, password: d.settings.adminPassword });
    }
    return seed;
  }
  // Migration: older docs carried credentials inside site/settings.
  if (remote.settings?.adminUsername || remote.settings?.adminPassword) {
    const credsSnap = await db.ref(ADMIN_CREDS_NODE).get();
    if (!credsSnap.exists()) {
      await db.ref(ADMIN_CREDS_NODE).set({
        username: remote.settings.adminUsername || buildDefaults().settings.adminUsername,
        password: remote.settings.adminPassword || buildDefaults().settings.adminPassword,
      });
    }
    remote.settings.adminUsername = "";
    remote.settings.adminPassword = "";
    await siteRef.set(rtdbSafe(remote as SiteData));
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

/** Write the whole site document to RTDB (credentials never belong here). */
export async function writeSiteDoc(data: SiteData): Promise<void> {
  const db = requireDb();
  const safe = rtdbSafe(data);
  // Belt & suspenders: even if a caller passes credentials, they never persist
  // in the publicly readable site node.
  safe.settings.adminUsername = "";
  safe.settings.adminPassword = "";
  await db.ref(SITE_NODE).set(safe);
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

/**
 * Remove admin credentials from a document before sending it to the browser.
 * Credentials are server-owned — the client never sees or sets them.
 */
export function stripCredentials(doc: SiteData): SiteData {
  return {
    ...doc,
    settings: {
      ...doc.settings,
      adminUsername: "",
      adminPassword: "",
    },
  };
}

/**
 * A client-sent document can never carry credentials: force the fields to
 * empty strings so they never persist in the public site node.
 */
export function applyServerOwnedFields(next: SiteData): SiteData {
  return stripCredentials(next);
}

export { getAdminApp };
