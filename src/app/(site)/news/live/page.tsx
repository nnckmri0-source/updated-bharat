"use client";

// Client-side fallback for articles created in the admin panel AFTER the last
// build. The hosting rewrite sends /news/{new-slug} here (200), this page
// reads the slug from the URL and renders it from the live Firebase store.
// Articles that HAVE a static page are served normally (rewrite never fires).
import { useEffect, useState } from "react";
import NewsClient from "../[slug]/NewsClient";

export default function LiveNewsFallback() {
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
