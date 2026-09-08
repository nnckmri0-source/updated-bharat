"use client";

// Client-side fallback for channels created in the admin panel AFTER the last
// build. The hosting rewrite sends /channel/{new-slug} here (200), this page
// reads the slug from the URL and renders it from the live Firebase store.
import { useEffect, useState } from "react";
import ChannelClient from "../[slug]/ChannelClient";

export default function LiveChannelFallback() {
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
