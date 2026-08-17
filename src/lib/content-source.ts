"use client";

// ============================================================================
// CONTENT SOURCE — localStorage (fallback) → Sanity (primary)
// ----------------------------------------------------------------------------
// The site reads content from Sanity in the browser (client-side) so admin
// edits in the Sanity Studio show up without a rebuild. When Sanity is
// unreachable or still empty, the store falls back to localStorage admin
// edits, then to the static defaults — the site never shows up blank.
// ============================================================================

import type { SiteData } from "@/lib/store";

export { USE_SANITY, sanityClient, sanityImg, portableTextToContent, fetchSanitySiteData, fetchSanitySlugs } from "@/lib/sanity";
export type { SiteData };
