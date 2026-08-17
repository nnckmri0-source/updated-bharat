import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Netlify drag-and-drop deploy (outputs to ./out).
  // Content lives in localStorage via admin, so no server needed.
  output: "export",
};

export default nextConfig;
