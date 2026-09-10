// POST /api/admin/migrate-images — one-time maintenance (admin session req):
// scans the whole site document for base64 data-URL images, uploads each to
// Firebase Storage and replaces it with a small permanent URL. Keeps the RTDB
// document tiny so the database stays fast and the free tier lasts.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { throwIfResponse, jsonError, readSiteDoc, writeSiteDoc } from "@/lib/api-utils";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { ADMIN_PROJECT_ID } from "@/lib/firebase-admin";
import { uploadToStorage } from "@/lib/gcs-upload";
import type { SiteData } from "@/lib/site-data";

export const dynamic = "force-dynamic";

function resolveBucket(): string {
  const explicit = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (explicit) return explicit;
  if (ADMIN_PROJECT_ID) return `${ADMIN_PROJECT_ID}.firebasestorage.app`;
  return "";
}

const DATA_URL = /^data:image\/([a-z+]+);base64,/i;

function extFromType(prefix: string): string {
  const t = (DATA_URL.exec(prefix)?.[1] ?? "webp").toLowerCase();
  if (t === "jpeg") return "jpg";
  if (t === "svg+xml") return "svg";
  return t;
}

async function uploadOne(dataUrl: string, folder: string): Promise<string | null> {
  if (!DATA_URL.test(dataUrl)) return null;
  const bucketName = resolveBucket();
  if (!bucketName) return null;
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) return null;
  const ext = extFromType(dataUrl);
  const path = `uploads/${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const result = await uploadToStorage(bucketName, path, buffer, `image/${ext === "svg" ? "svg+xml" : ext}`);
  return result.url;
}

export async function POST(_req: NextRequest) {
  try {
    const admin = await verifyAdminRequest();
    if (!admin) return jsonError("Unauthorized", 401);

    const doc = await readSiteDoc();
    let migrated = 0;
    let failed = 0;

    const migrateStr = async (v: string | null | undefined, folder: string): Promise<string | null> => {
      if (!v || !DATA_URL.test(v)) return null;
      try {
        const url = await uploadOne(v, folder);
        if (url) {
          migrated++;
          return url;
        }
      } catch {
        failed++;
      }
      return null;
    };

    const next: SiteData = { ...doc, news: [...doc.news], channels: [...doc.channels], stories: [...doc.stories], editions: [...doc.editions], polls: [...doc.polls] };

    for (const n of next.news) {
      const url = await migrateStr(n.image, "news");
      if (url) n.image = url;
      // Content HTML may embed data: images (rich editor pastes)
      if (n.content && DATA_URL.test(n.content)) {
        const parts = n.content.split(/(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)/g);
        for (let i = 1; i < parts.length; i += 2) {
          const url2 = await migrateStr(parts[i], "content");
          if (url2) parts[i] = url2;
        }
        n.content = parts.join("");
      }
    }
    for (const c of next.channels) {
      const url = await migrateStr(c.icon, "icons");
      if (url) c.icon = url;
    }
    for (const s of next.stories) {
      const url = await migrateStr(s.image, "stories");
      if (url) s.image = url;
      if (s.slides) {
        for (const sl of s.slides) {
          const u = await migrateStr(sl.image, "stories");
          if (u) sl.image = u;
        }
      }
    }
    for (const e of next.editions) {
      const url = await migrateStr(e.cover, "epaper");
      if (url) e.cover = url;
    }
    for (const key of ["afterTitle", "afterAuthor", "inArticle", "beforeShare"] as const) {
      const url = await migrateStr(next.settings.adSlots[key], "ads");
      if (url) next.settings.adSlots[key] = url;
    }
    const logo = await migrateStr(next.settings.logo, "site");
    if (logo) next.settings.logo = logo;
    const favicon = await migrateStr(next.settings.favicon, "site");
    if (favicon) next.settings.favicon = favicon;

    await writeSiteDoc(next);
    return NextResponse.json({ ok: true, migrated, failed });
  } catch (e) {
    throwIfResponse(e);
    console.error("[api/admin/migrate-images POST]", e);
    return jsonError("Migration failed", 500);
  }
}
