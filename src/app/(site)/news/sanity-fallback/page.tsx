"use client";

// Client-side fallback for Sanity articles created AFTER the last build.
// Netlify rewrites /news/{new-slug} → /news/_sanity (200), and this page reads
// the slug from the URL, then renders the article from the live Sanity store.
// Articles that HAVE a static page are served normally (redirect never fires).
import { useEffect, useState } from "react";
import NewsClient from "../[slug]/NewsClient";

export default function SanityNewsFallback() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname; // e.g. /news/my-new-post
    const m = path.match(/^\/news\/([^/]+)\/?$/);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time slug read after hydration
    setSlug(m ? decodeURIComponent(m[1]) : null);
  }, []);

  if (!slug) return null;
  return <NewsClient slug={slug} />;
}
