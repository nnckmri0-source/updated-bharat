// POST /api/upload — store an admin-uploaded image in Firebase Storage.
// (admin session required)
// ----------------------------------------------------------------------------
// The client compresses the image to a tiny WebP first (see
// src/lib/image-compress.ts) and sends a data-URL. We drop it into the
// bucket under uploads/<folder>/… with a permanent download token and return
// the public URL — so the Realtime Database document only ever stores URLs,
// never base64 blobs.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { throwIfResponse, jsonError } from "@/lib/api-utils";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { ADMIN_PROJECT_ID } from "@/lib/firebase-admin";
import { uploadToStorage } from "@/lib/gcs-upload";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB after compression is already way beyond targets

function resolveBucket(): string {
  const explicit = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (explicit) return explicit;
  if (ADMIN_PROJECT_ID) return `${ADMIN_PROJECT_ID}.firebasestorage.app`;
  return "";
}

function extFromType(dataUrl: string): string {
  const m = /^data:image\/([a-z+]+);/.exec(dataUrl);
  const t = m?.[1] ?? "webp";
  if (t === "jpeg") return "jpg";
  if (t === "svg+xml") return "svg";
  return t;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminRequest();
    if (!admin) return jsonError("Unauthorized", 401);

    const { dataUrl, name, folder } = (await req.json()) as { dataUrl?: string; name?: string; folder?: string };
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      return jsonError("dataUrl (image data-URL) is required", 400);
    }
    const bucketName = resolveBucket();
    if (!bucketName) return jsonError("Storage bucket not configured", 503);

    const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > MAX_BYTES) return jsonError("Image too large even after compression", 413);

    const safeFolder = (folder || "misc").replace(/[^a-z0-9-]/gi, "-").slice(0, 40);
    const safeName = (name || "image")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9-_]/gi, "-")
      .slice(0, 60) || "image";
    const ext = extFromType(dataUrl);
    const path = `uploads/${safeFolder}/${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}.${ext}`;

    const result = await uploadToStorage(bucketName, path, buffer, `image/${ext === "svg" ? "svg+xml" : ext}`);
    return NextResponse.json({ ok: true, url: result.url, bytes: result.bytes });
  } catch (e) {
    throwIfResponse(e);
    console.error("[api/upload POST]", e);
    return jsonError("Upload failed", 500);
  }
}
