// Server-only live site document (request-memoized).
// ----------------------------------------------------------------------------
// Lets server components (article/channel pages, metadata) render the FRESH
// Firebase content into the first HTML paint — new admin posts appear instantly
// with no client "loading" flash. Null when the backend is unreachable
// (e.g. static build without Firebase env) — pages then hydrate client-side.

import { cache } from "react";
import { readSiteDoc } from "@/lib/api-utils";
import type { SiteData } from "@/lib/site-data";

export const getServerDoc = cache(async (): Promise<SiteData | null> => {
  try {
    return await readSiteDoc();
  } catch {
    return null;
  }
});
