"use client";

// ============================================================================
// FIREBASE CONFIG
// ----------------------------------------------------------------------------
// Paste your Firebase web-app config below (Project settings → General →
// "Your apps" → SDK setup and configuration). These are PUBLIC client values
// (like a Google Maps key) — access control comes from Realtime Database
// rules, not from hiding them.
//
// No config filled in yet? The site runs fine on localStorage defaults and
// the admin panel still works — it just won't sync to the cloud.
// ============================================================================

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const env = (k: string) => process.env[`NEXT_PUBLIC_FIREBASE_${k}` as keyof import("@firebase/app").FirebaseOptions] as string | undefined;

export const firebaseConfig = {
  apiKey: env("API_KEY") || "",
  authDomain: env("AUTH_DOMAIN") || "",
  databaseURL: env("DATABASE_URL") || "", // https://<db>-<hash>.firebasedatabase.app
  projectId: env("PROJECT_ID") || "",
  storageBucket: env("STORAGE_BUCKET") || "",
  messagingSenderId: env("MESSAGING_SENDER_ID") || "",
  appId: env("APP_ID") || "",
};

export const FIREBASE_READY = Boolean(firebaseConfig.databaseURL && firebaseConfig.projectId && firebaseConfig.apiKey);

let app: FirebaseApp | null = null;
export function getDb() {
  if (!FIREBASE_READY) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return getDatabase(app);
}
