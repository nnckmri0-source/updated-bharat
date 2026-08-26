"use client";

// ============================================================================
// SITE DATA STORE
// ---------------------------------------------------------------
// Single source of truth for everything rendered on the frontend.
// Reads from localStorage (admin edits) with static defaults as fallback.
// Firebase-ready: swap the localStorage read/write below with Firestore
// calls later — the rest of the app (useSiteData) stays unchanged.
// ============================================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { news as defaultNews } from "@/data/news";
import { channels as defaultChannels, type Channel } from "@/data/channels";
import { stories as defaultStories } from "@/data/stories";
import { siteConfig as defaultSiteConfig } from "@/data/site";
import { USE_SANITY, fetchSanitySiteData } from "@/lib/content-source";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type NewsArticle = {
  slug: string;
  title: string;
  channel: string | null;
  channelName: string | null;
  date: string;
  content: string; // HTML or legacy "\n\n" paragraphs; rendered as HTML
  description?: string; // SEO excerpt under title
  image: string | null;
  imageAlt?: string | null;
  imageCaption?: string | null;
};

export type WebStorySlide = {
  image: string | null;
  title?: string | null;
  caption?: string | null;
  alt?: string | null;
};

export type WebStory = {
  id: string;
  title: string;
  slug?: string | null;
  category?: string | null;
  description?: string | null;
  image: string | null;
  url: string;
  slides?: WebStorySlide[];
};

export type { Channel };

export type EPaperEdition = {
  name: string;
  date: string;
  cover: string;
  pdf: string;
};

export type FooterLink = {
  title: string;
  href: string;
};

export type HomeWidget = {
  slug: string;
  color: string;
  style?: "list" | "magazine" | "video";
};

export type SiteSettings = {
  name: string;
  tagline: string;
  logo: string;
  footerAbout: string;
  copyright: string;
  adminPassword: string;
  liveUrl: string;
  social: { facebook: string; twitter: string; instagram: string; youtube: string; whatsapp: string };
  adSlots: { afterTitle: string; afterAuthor: string; inArticle: string; beforeShare: string };
  onesignalAppId: string;
  adsenseHeaderCode: string;
  adsenseInArticleCode: string;
  adsenseSidebarCode: string;
};

export type Poll = {
  id: string;
  question: string;
  options: string[];
  published: boolean;
};

export type HomeConfig = {
  heroMain: string;
  subFeatured: string[];
  latestGrid: string[];
  widgets: HomeWidget[];
};

export type FooterConfig = {
  quickLinks: FooterLink[];
  tags: FooterLink[];
  categorySlugs: string[];
};

export type SiteData = {
  news: NewsArticle[];
  channels: Channel[];
  stories: WebStory[];
  editions: EPaperEdition[];
  settings: SiteSettings;
  ticker: string[];
  trending: string[];
  home: HomeConfig;
  footer: FooterConfig;
  polls: Poll[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Ensure asset paths are absolute (/uploads/...) so they work on any route. */
export function norm(p: string | null | undefined): string | null {
  if (!p) return null;
  if (p.startsWith("http") || p.startsWith("/") || p.startsWith("data:")) {
    // Picsum is flaky/blocked in some Indian ISPs — rewrite to reliable placeholder + keep sanity CDN as-is
    if (p.includes("picsum.photos")) {
      // Use a stable Sanity CDN image as fallback (guaranteed to exist) with seed hash preserved for variety
      const seed = p.split("/seed/")[1]?.split("/")[0] ?? "news";
      // Use placehold.co as ultra-reliable fallback (no CORS issues)
      return `https://placehold.co/800x500/f47216/ffffff?text=${encodeURIComponent(seed.slice(0, 12))}`;
    }
    return p;
  }
  return "/" + p;
}

/** Fallback image for any broken <img> — used via onError */
export const FALLBACK_IMG = "https://placehold.co/800x500/f47216/ffffff?text=Updated+Bharat";

/** Simple URL-ish slug generator for new articles/channels. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// v6: picsum → placehold.co fallback for Indian ISP blocks + reliable images — bump to force fresh cache
export const STORAGE_KEY = "bhaskar_site_data_v6";
export const ADMIN_AUTH_KEY = "bhaskar_admin_auth";
const LEGACY_KEYS = ["bhaskar_site_data_v5", "bhaskar_site_data_v4", "bhaskar_site_data_v3", "bhaskar_site_data_v2", "bhaskar_site_data"];

// ---------------------------------------------------------------------------
// Defaults (mirror the static clone exactly)
// ---------------------------------------------------------------------------
export function buildDefaults(): SiteData {
  const ticker = Array.from(new Set(defaultSiteConfig.ticker.map((t) => t.trim()).filter(Boolean)));
  return {
    news: defaultNews.map((n) => ({
      ...n,
      description: (n as unknown as Record<string, unknown>).description as string | undefined ?? "",
      imageAlt: null,
      imageCaption: null,
      image: norm(n.image),
    })),
    channels: defaultChannels.map((c) => ({ ...c, icon: norm(c.icon) })),
    stories: defaultStories.map((s, i) => ({
      ...s,
      id: s.id ?? `story-${i}`,
      slug: (s as unknown as Record<string, unknown>).slug as string | undefined ?? null,
      category: (s as unknown as Record<string, unknown>).category as string | undefined ?? null,
      description: (s as unknown as Record<string, unknown>).description as string | undefined ?? null,
      title: s.title || "Web Story",
      image: norm(s.image),
      url: (s as unknown as Record<string, unknown>).slug ? `/visualstories/${(s as unknown as Record<string, unknown>).slug}` : s.url === "#" || s.url.includes("index.html") ? "/web-stories" : s.url,
      slides: (s as unknown as Record<string, unknown>).slides as WebStorySlide[] | undefined ?? undefined,
    })),
    editions: [
      {
        name: "Updated Bharat",
        date: "Latest Edition",
        cover: "https://picsum.photos/seed/updated-bharat-epaper/600/800",
        pdf: "",
      },
    ],
    settings: {
      name: defaultSiteConfig.name,
      tagline: defaultSiteConfig.tagline,
      logo: norm(defaultSiteConfig.logo) ?? "",
      footerAbout: "Get the latest news delivered straight to your inbox.",
      copyright: "All rights reserved.",
      adminPassword: "admin123",
      liveUrl: "",
      social: { ...defaultSiteConfig.social },
      adSlots: { ...defaultSiteConfig.adSlots },
      onesignalAppId: "",
      adsenseHeaderCode: "",
      adsenseInArticleCode: "",
      adsenseSidebarCode: "",
    },
    ticker,
    trending: defaultSiteConfig.trending,
    home: {
      heroMain: "exclusive-blockbuster-movie-releases-emerge-as-key-trend-bi9n",
      subFeatured: [
        "new-study-reveals-how-urban-green-space-essays-surpass-industry-expect-121r",
        "exclusive-scholarship-opportunities-win-global-recognition-8mze",
        "football-league-campaigns-transform-the-landscape-1n6o",
      ],
      latestGrid: [
        "exclusive-blockbuster-movie-releases-emerge-as-key-trend-bi9n",
        "new-study-reveals-how-climate-model-refinements-transform-the-landscap-yov2",
        "new-study-reveals-how-riverfront-development-emerges-as-key-trend-1jgu",
        "stress-management-tips-gather-momentum-1862",
        "budget-electric-scooters-transform-the-landscape-15ou",
        "exclusive-msme-support-schemes-gather-momentum-o0wl",
      ],
      widgets: [
        { slug: "entertainment", color: "#FF9F1C", style: "list" },
        { slug: "politics", color: "#E63946", style: "magazine" },
        { slug: "business", color: "#4361EE", style: "video" },
        { slug: "finance", color: "#0A9396", style: "list" },
        { slug: "sports", color: "#2EC4B6", style: "list" },
        { slug: "technology", color: "#7209B7", style: "list" },
        { slug: "health", color: "#06D6A0", style: "list" },
        { slug: "world", color: "#1D3557", style: "list" },
        { slug: "education", color: "#F77F00", style: "list" },
        { slug: "lifestyle", color: "#BC6C25", style: "list" },
        { slug: "science", color: "#283618", style: "list" },
        { slug: "finance", color: "#059669", style: "video" },
      ],
    },
    polls: [
      {
        id: "poll-who-wins-ipl-2026",
        question: "Who will win IPL 2026?",
        options: ["Chennai Super Kings", "Mumbai Indians", "RCB", "Other"],
        published: true,
      },
    ],
    footer: {
      quickLinks: [
        { title: "Home", href: "/" },
        { title: "Web Stories", href: "/web-stories" },
        { title: "E-Paper", href: "/e-newspaper" },
        { title: "Latest News", href: "/latest" },
        { title: "Saved Stories", href: "/bookmarks" },
      ],
      tags: [
        { title: "Privacy Policy", href: "/" },
        { title: "Terms", href: "/" },
        { title: "Sitemap", href: "/" },
        { title: "Advertise", href: "/" },
        { title: "Careers", href: "/" },
        { title: "RSS Feed", href: "/" },
        { title: "Cookie Policy", href: "/" },
      ],
      categorySlugs: [
        "db-original",
        "ipl-2026",
        "lifestyle",
        "science",
        "uttar-pradesh",
        "opinion",
        "election-2026",
        "jeevan-mantra",
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Merge stored data over defaults (so new default fields never break stored data)
// ---------------------------------------------------------------------------
function mergeStored(raw: string | null): SiteData {
  const d = buildDefaults();
  if (!raw) return d;
  try {
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return d;
    return {
      ...d,
      ...p,
      settings: {
        ...d.settings,
        ...(p.settings ?? {}),
        social: { ...d.settings.social, ...(p.settings?.social ?? {}) },
        adSlots: { ...d.settings.adSlots, ...(p.settings?.adSlots ?? {}) },
      },
      home: { ...d.home, ...(p.home ?? {}) },
      footer: { ...d.footer, ...(p.footer ?? {}) },
    };
  } catch {
    return d;
  }
}

/** Keep non-empty values only (used so Sanity only fills gaps, never clears). */
function nonEmpty<T extends Record<string, unknown>>(o: T | undefined): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o ?? {})) {
    if (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)) out[k] = v;
  }
  return out as Partial<T>;
}

/**
 * Merge Sanity content over the current data. Sanity is the source of truth
 * for content, but items created in the admin panel that are NOT yet in Sanity
 * (or still in the CDN cache) are appended so admin edits show up instantly
 * instead of being wiped by the Sanity refresh. Settings keep admin/localStorage
 * values — Sanity only fills EMPTY fields and NEVER overrides adminPassword.
 */
function mergeBySlug<T extends { slug: string }>(sanity: T[], local: T[]): T[] {
  const seen = new Set(sanity.map((x) => x.slug));
  return [...sanity, ...local.filter((x) => !seen.has(x.slug))];
}

/** Stories dedupe by id AND title (Sanity seeds use different ids than defaults). */
function mergeStories(sanity: WebStory[], local: WebStory[]): WebStory[] {
  const seenIds = new Set(sanity.map((s) => s.id));
  const seenTitles = new Set(sanity.map((s) => s.title.trim().toLowerCase()));
  const extra = local.filter((s) => !seenIds.has(s.id) && !seenTitles.has(s.title.trim().toLowerCase()));
  return [...sanity, ...extra];
}
function mergeSanity(cur: SiteData, s: Partial<SiteData>): SiteData {
  // settings: local (admin panel) wins — Sanity only fills gaps so the admin
  // panel stays the source of truth for name/social/ads; password never synced.
  const curS = cur.settings;
  const sanS = (s.settings ?? {}) as Partial<SiteSettings>;
  const settings: SiteData["settings"] = {
    ...curS,
    name: curS.name || sanS.name || "",
    tagline: curS.tagline || sanS.tagline || "",
    logo: curS.logo || sanS.logo || "",
    footerAbout: curS.footerAbout || sanS.footerAbout || curS.footerAbout,
    copyright: curS.copyright || sanS.copyright || curS.copyright,
    liveUrl: curS.liveUrl || sanS.liveUrl || "",
    adminPassword: curS.adminPassword,
    social: {
      facebook: curS.social.facebook || sanS.social?.facebook || "",
      twitter: curS.social.twitter || sanS.social?.twitter || "",
      instagram: curS.social.instagram || sanS.social?.instagram || "",
      youtube: curS.social.youtube || sanS.social?.youtube || "",
      whatsapp: curS.social.whatsapp || sanS.social?.whatsapp || "",
    },
    adSlots: {
      afterTitle: curS.adSlots.afterTitle || sanS.adSlots?.afterTitle || "",
      afterAuthor: curS.adSlots.afterAuthor || sanS.adSlots?.afterAuthor || "",
      inArticle: curS.adSlots.inArticle || sanS.adSlots?.inArticle || "",
      beforeShare: curS.adSlots.beforeShare || sanS.adSlots?.beforeShare || "",
    },
    onesignalAppId: curS.onesignalAppId || sanS.onesignalAppId || "",
    adsenseHeaderCode: curS.adsenseHeaderCode || sanS.adsenseHeaderCode || "",
    adsenseInArticleCode: curS.adsenseInArticleCode || sanS.adsenseInArticleCode || "",
    adsenseSidebarCode: curS.adsenseSidebarCode || sanS.adsenseSidebarCode || "",
  };
  return {
    ...cur,
    news: Array.isArray(s.news) && s.news.length ? mergeBySlug(s.news, cur.news) : cur.news,
    channels: Array.isArray(s.channels) && s.channels.length ? mergeBySlug(s.channels, cur.channels) : cur.channels,
    stories: Array.isArray(s.stories) && s.stories.length ? mergeStories(s.stories, cur.stories) : cur.stories,
    editions: Array.isArray(s.editions) && s.editions.length ? s.editions : cur.editions,
    polls: Array.isArray(s.polls) && s.polls.length ? s.polls : cur.polls,
    ticker: Array.isArray(s.ticker) && s.ticker.length ? s.ticker : cur.ticker,
    trending: Array.isArray(s.trending) && s.trending.length ? s.trending : cur.trending,
    settings,
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
type StoreValue = {
  data: SiteData;
  update: (fn: (draft: SiteData) => SiteData) => void;
  reset: () => void;
};

const SiteDataContext = createContext<StoreValue | null>(null);

export function SiteDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SiteData>(() => buildDefaults());

  // Hydrate content after first paint. SSR renders defaults first so the
  // initial HTML always matches. On the client we apply localStorage admin
  // edits IMMEDIATELY (synchronous), then Sanity on top of that when it
  // resolves — Sanity is the source of truth for content, localStorage covers
  // admin-only fields (home/footer/design) and offline/empty-Sanity fallback.
  useEffect(() => {
    let cancelled = false;
    let merged: SiteData | null = null;
    try {
      // Clean legacy keys to prevent flicker from old v4 data
      for (const k of LEGACY_KEYS) {
        try { localStorage.removeItem(k); } catch { /* */ }
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        merged = mergeStored(raw);
        // Detect stale v4 shape (stories without slug) → force fresh defaults
        const stale = (merged.stories as unknown as { slug?: string }[] | undefined)?.some((s) => !s.slug) && merged.stories.length > 0;
        if (stale) {
          try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
          merged = null;
        }
      }
    } catch {
      /* ignore */
    }
    if (merged) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration
      setData(merged);
    }
    if (USE_SANITY) {
      (async () => {
        try {
          const s = await fetchSanitySiteData();
          if (!cancelled && s) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration
            setData((prev) => mergeSanity(prev, s));
          }
        } catch {
          /* Sanity unreachable — keep localStorage/defaults */
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((fn: (draft: SiteData) => SiteData) => {
    setData((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage full / unavailable — keep in-memory */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setData(buildDefaults());
  }, []);

  const value = useMemo(() => ({ data, update, reset }), [data, update, reset]);
  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData(): StoreValue {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error("useSiteData must be used inside <SiteDataProvider>");
  return ctx;
}
