import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server backend (API routes + Firebase Admin SDK) — no more static export.
  // Deploy to any Node host (Vercel, VPS, `npm run build && npm run start`).
  // next/image has no optimizer in the old static setup; keep it unoptimized —
  // the site uses plain <img> tags everywhere.
  images: { unoptimized: true },
};

export default nextConfig;
