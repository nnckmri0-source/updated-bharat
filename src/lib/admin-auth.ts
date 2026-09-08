// Server-side admin authentication for /api/* routes.
// ----------------------------------------------------------------------------
// Login: POST /api/admin/login { username, password } → verifies against the
// admin credentials stored in Firebase (site.settings) and returns an HttpOnly
// session cookie. All write routes verify this cookie via verifyAdminRequest().
// The adminUsername/adminPassword are synced from the cloud into
// site.settings but are ALWAYS device-local (never overwritten by the cloud) —
// see store.tsx mergeRemote().
// NOTE: unlike the panel login, this validates against the CLOUD copy of the
// credentials (local device value may differ). They match unless someone
// changed the password in one place only.

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { readAdminCreds } from "@/lib/api-utils";
import { ADMIN_READY } from "@/lib/firebase-admin";

const COOKIE_NAME = "ub_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.FIREBASE_SERVICE_ACCOUNT || // deterministic fallback — full SA JSON is already a server-only secret
    ""
  );
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createSessionToken(username: string): string {
  const payload = `${username}|${Date.now() + SESSION_TTL_MS}|${randomBytes(12).toString("hex")}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): { username: string } | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [username, expiry] = payload.split("|");
  if (!username || !expiry || Number(expiry) < Date.now()) return null;
  return { username };
}

export async function verifyAdminRequest(): Promise<{ username: string } | null> {
  if (!ADMIN_READY) return null;
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export async function checkAdminCredentials(username: string, password: string): Promise<string | null> {
  if (!ADMIN_READY) return null;
  const creds = await readAdminCreds();
  if (username.trim() === creds.username && password === creds.password) return creds.username;
  return null;
}

export const ADMIN_COOKIE = COOKIE_NAME;
export const ADMIN_COOKIE_MAX_AGE = SESSION_TTL_MS / 1000;
