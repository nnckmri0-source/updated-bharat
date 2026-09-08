// ============================================================================
// FIREBASE ADMIN SDK — server-side only (API routes / Node)
// ----------------------------------------------------------------------------
// NEVER import this from a client component — the service account is a full
// database admin. Credentials come from (in order):
//   1. FIREBASE_SERVICE_ACCOUNT       — service-account JSON inline (raw or base64)
//   2. FIREBASE_SERVICE_ACCOUNT_PATH  — path to the JSON file on disk
//   3. GOOGLE_APPLICATION_CREDENTIALS — standard ADC file path
//   4. implicit ADC                   — gcloud/Vercel/Cloud identity
// The RTDB URL comes from FIREBASE_DATABASE_URL (https://<db>.firebasedatabase.app)
// — falls back to the NEXT_PUBLIC_FIREBASE_DATABASE_URL client var if set.
// ============================================================================

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";

type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function parseServiceAccount(raw: string): ServiceAccount {
  let json = raw.trim();
  // Base64-wrapped JSON (safer to paste into env vars / hosting dashboards)
  if (!json.startsWith("{")) {
    json = Buffer.from(json, "base64").toString("utf8");
  }
  return JSON.parse(json) as ServiceAccount;
}

function loadServiceAccount(): ServiceAccount | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    try {
      return parseServiceAccount(inline);
    } catch (e) {
      console.error("[firebase-admin] FIREBASE_SERVICE_ACCOUNT is not valid JSON/base64:", (e as Error).message);
    }
  }
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- Node-only file read inside a server module
      return JSON.parse(require("fs").readFileSync(path, "utf8")) as ServiceAccount;
    } catch (e) {
      console.error(`[firebase-admin] Could not read service account file at ${path}:`, (e as Error).message);
    }
  }
  return null;
}

export const ADMIN_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || loadServiceAccount()?.project_id || "";
export const ADMIN_DATABASE_URL =
  process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "";

export const ADMIN_READY = Boolean(ADMIN_DATABASE_URL && ADMIN_PROJECT_ID);

let adminApp: App | null = null;

/** Initialized admin app (throws if credentials are missing — callers check ADMIN_READY first). */
export function getAdminApp(): App {
  if (adminApp) return adminApp;
  const account = loadServiceAccount();
  if (account?.client_email && account.private_key) {
    adminApp =
      getApps().find((a) => a.name === "admin") ??
      initializeApp(
        {
          credential: cert({
            projectId: ADMIN_PROJECT_ID || account.project_id,
            clientEmail: account.client_email,
            privateKey: account.private_key.replace(/\\n/g, "\n"),
          }),
          databaseURL: ADMIN_DATABASE_URL,
        },
        "admin"
      );
  } else {
    // Fall back to Application Default Credentials (gcloud auth, Vercel, Cloud Run…)
    adminApp =
      getApps().find((a) => a.name === "admin") ??
      initializeApp({ databaseURL: ADMIN_DATABASE_URL }, "admin");
  }
  return adminApp;
}

/** Admin Realtime Database handle — full read/write, bypasses security rules. */
export function getAdminDb(): Database {
  return getDatabase(getAdminApp());
}
