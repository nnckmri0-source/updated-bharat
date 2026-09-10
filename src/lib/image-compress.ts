"use client";

// ============================================================================
// IMAGE COMPRESSION — every admin upload is crushed to a tiny WebP before it
// ever reaches Firebase. Text stays in the RTDB doc, images go to Firebase
// Storage as URLs — the database doc stays small, so the free tier lasts.
//
// Targets are deliberately aggressive (site renders these at card sizes, so
// the visual loss is minimal at 15-25KB):
//   cover   — news/e-paper/ad covers   ≤ 720px,  ~22 KB
//   story   — web-story slides (9:16)  ≤ 480px,  ~12 KB
//   icon    — channel icons            ≤ 128px,  ~ 4 KB
//   logo    — site logo (alpha kept)   ≤ 320px,  ~15 KB
//   content — images inside articles   ≤ 640px,  ~15 KB
// ============================================================================

export type ImagePreset = "cover" | "story" | "icon" | "logo" | "content";

const PRESETS: Record<ImagePreset, { maxDim: number; targetKB: number; minQuality: number }> = {
  cover: { maxDim: 720, targetKB: 22, minQuality: 0.3 },
  story: { maxDim: 480, targetKB: 12, minQuality: 0.3 },
  icon: { maxDim: 128, targetKB: 4, minQuality: 0.4 },
  logo: { maxDim: 320, targetKB: 15, minQuality: 0.4 },
  content: { maxDim: 640, targetKB: 15, minQuality: 0.3 },
};

const QUALITY_STEPS = [0.75, 0.6, 0.45, 0.35, 0.3, 0.25];

function drawScaled(file: File, maxDim: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas 2d unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Compress an image file to the preset's target size. Returns a WebP (or
 * JPEG fallback) data-URL. Never throws for quality reasons — best effort.
 */
export async function compressImage(file: File, preset: ImagePreset = "cover"): Promise<string> {
  const p = PRESETS[preset] ?? PRESETS.cover;
  const canvas = await drawScaled(file, p.maxDim);
  // WebP first (smallest, keeps transparency); JPEG fallback for old browsers.
  const types = ["image/webp", "image/jpeg"];
  let best: { blob: Blob; type: string } | null = null;
  for (const type of types) {
    for (const q of QUALITY_STEPS) {
      if (q < p.minQuality) break;
      const blob = await canvasToBlob(canvas, type, q);
      if (!blob) break;
      best = { blob, type };
      if (blob.size <= p.targetKB * 1024) {
        return blobToBase64(blob);
      }
    }
    if (best && type === "image/webp") {
      // WebP works — keep iterating to minQuality; if we get here, no step met
      // the target, so the smallest quality result so far is the best we have
      // for this type. Jump to the next type only as a compatibility fallback.
      continue;
    }
  }
  if (!best) throw new Error("Compression failed");
  return blobToBase64(best.blob);
}

/**
 * Upload a compressed image to Firebase Storage via the server API (Admin
 * SDK). Returns a permanent public URL. Throws if the server is unreachable.
 */
export async function uploadCompressedImage(
  dataUrl: string,
  originalName: string,
  folder: string
): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dataUrl, name: originalName, folder }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(json.error || `Upload failed (${res.status})`);
  }
  const json = (await res.json()) as { ok: boolean; url: string };
  return json.url;
}

export const IMAGE_PRESET_HINT: Record<ImagePreset, string> = {
  cover: "compressed to ~22 KB WebP",
  story: "compressed to ~12 KB WebP",
  icon: "compressed to ~4 KB WebP",
  logo: "compressed to ~15 KB WebP",
  content: "compressed to ~15 KB WebP",
};
