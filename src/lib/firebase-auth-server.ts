// Firebase Authentication — server-side helpers (Identity Toolkit REST API).
// ----------------------------------------------------------------------------
// Admin panel supports TWO login methods:
//   1. Legacy Admin ID + password  → private "admin-credentials" node
//   2. Email + password            → Firebase Auth (verified server-side), and
//                                     the email must be in the admin allowlist
//                                     ("admin-emails" node — managed by the
//                                     logged-in admin in the panel).
// Password reset emails are sent by Firebase (accounts:sendOobCode).

import { jsonError } from "@/lib/api-utils";
import { getAdminDb } from "@/lib/firebase-admin";

export const EMAILS_NODE = "admin-emails";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export async function listAllowlistedEmails(): Promise<string[]> {
  const db = getAdminDb();
  const snap = await db.ref(EMAILS_NODE).get();
  const val = (snap.val() as Record<string, boolean> | null) ?? {};
  return Object.keys(val).filter((k) => val[k]);
}

export async function isEmailAllowlisted(email: string): Promise<boolean> {
  const db = getAdminDb();
  const snap = await db.ref(`${EMAILS_NODE}/${normEmail(email).replace(/[.#$/\[\]]/g, "_")}`).get();
  const val = snap.val();
  // Also check the raw email key form (Firebase keys can't contain ., #, $, [, ])
  if (val === true) return true;
  const all = await listAllowlistedEmails();
  return all.includes(normEmail(email));
}

export async function setEmailAllowlisted(email: string, allowed: boolean): Promise<void> {
  const db = getAdminDb();
  await db.ref(`${EMAILS_NODE}/${normEmail(email).replace(/[.#$/\[\]]/g, "_")}`).set(allowed ? true : null);
}

type IdtError = { error?: { message?: string } };

async function idtCall(action: string, body: Record<string, unknown>): Promise<{ ok: boolean; code?: string }> {
  if (!API_KEY) return { ok: false, code: "MISSING_API_KEY" };
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const json = (await res.json().catch(() => ({}))) as IdtError;
    return { ok: false, code: json.error?.message?.split(": ")[0] ?? String(res.status) };
  } catch {
    return { ok: false, code: "NETWORK_ERROR" };
  }
}

/** Verify an email+password against Firebase Auth. */
export async function authPasswordSignIn(email: string, password: string): Promise<{ ok: boolean; code?: string }> {
  return idtCall("signInWithPassword", { email: normEmail(email), password, returnSecureToken: true });
}

/** Create the Auth account on first login (email must already be allowlisted). */
export async function authSignUp(email: string, password: string): Promise<{ ok: boolean; code?: string }> {
  return idtCall("signUp", { email: normEmail(email), password, returnSecureToken: true });
}

/** Send the Firebase password-reset email (contains the secure reset link). */
export async function authSendPasswordReset(email: string): Promise<{ ok: boolean; code?: string }> {
  return idtCall("sendOobCode", { requestType: "PASSWORD_RESET", email: normEmail(email) });
}

export { jsonError };
