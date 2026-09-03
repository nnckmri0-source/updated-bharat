import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Netlify drag-and-drop deploy (outputs to ./out).
  // Content lives in localStorage via admin, so no server needed.
  output: "export",
  // Required with output:export — next/image has no optimizer server here.
  // (The site uses plain <img>, this just prevents cryptic build errors later.)
  images: { unoptimized: true },
};

export default nextConfig;
