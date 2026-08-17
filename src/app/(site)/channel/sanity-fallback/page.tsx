"use client";

// Client-side fallback for Sanity channels created AFTER the last build.
// Netlify rewrites /channel/{new-slug} → /channel/_sanity (200), and this page
// reads the slug from the URL, then renders the channel from the live store.
import { useEffect, useState } from "react";
import ChannelClient from "../[slug]/ChannelClient";

export default function SanityChannelFallback() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname; // e.g. /channel/my-new-channel
    const m = path.match(/^\/channel\/([^/]+)\/?$/);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time slug read after hydration
    setSlug(m ? decodeURIComponent(m[1]) : null);
  }, []);

  if (!slug) return null;
  return <ChannelClient slug={slug} />;
}
