// ============================================================================
// SITE DATA — shared types, defaults, merge logic (server + client safe)
// ----------------------------------------------------------------------------
// No React, no "use client" — imported by both src/lib/store.tsx (browser) and
// src/app/api/* route handlers (Node server with Firebase Admin SDK).
// ============================================================================

import { news as defaultNews } from "@/data/news";
import { channels as defaultChannels, type Channel } from "@/data/channels";
import { stories as defaultStories } from "@/data/stories";
import { siteConfig as defaultSiteConfig } from "@/data/site";

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
  favicon: string;
  socialVisible: boolean;
  footerAbout: string;
  copyright: string;
  adminUsername: string;
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
  // Keep remote photos (picsum etc.) as-is — they render real pictures.
  // If a remote host is blocked, the global <img> error handler in
  // SiteHeadInject swaps in the local /placeholders/*.svg fallback (offline-safe).
  if (p.startsWith("http") || p.startsWith("/") || p.startsWith("data:")) return p;
  return "/" + p;
}

/** Local offline-safe fallbacks (served from /public, always available in production). */
export const FALLBACK_IMG = "/placeholders/news-800x500.svg";
export const FALLBACK_STORY_IMG = "/placeholders/story-400x500.svg";
export const FALLBACK_EPAPER_IMG = "/placeholders/epaper-600x800.svg";

/** Simple URL-ish slug generator for new articles/channels. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const STORAGE_KEY = "bhaskar_site_data_v8";
export const ADMIN_AUTH_KEY = "bhaskar_admin_auth";
export const ADMIN_CRED_KEY = "bhaskar_admin_cred";
const LEGACY_KEYS = ["bhaskar_site_data_v7", "bhaskar_site_data_v6", "bhaskar_site_data_v5", "bhaskar_site_data_v4", "bhaskar_site_data_v3", "bhaskar_site_data_v2", "bhaskar_site_data"];

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
        cover: "/placeholders/epaper-600x800.svg",
        pdf: "",
      },
    ],
    settings: {
      name: defaultSiteConfig.name,
      tagline: defaultSiteConfig.tagline,
      logo: norm(defaultSiteConfig.logo) ?? "",
      favicon: "",
      socialVisible: true,
      footerAbout: "Get the latest news delivered straight to your inbox.",
      copyright: "All rights reserved.",
      adminUsername: "bharat.admin",
      adminPassword: "UB#2026$Bharat!Admin",
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
export function mergeStored(raw: string | null): SiteData {
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
        // Credentials are server-owned secrets: localStorage may hold stale
        // copies (the public API no longer returns them). Defaults win here —
        // the real values only exist in Firebase and never render client-side.
        adminUsername: "",
        adminPassword: "",
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

/**
 * Merge remote (server/Firebase) data over local. Remote is the live source of
 * truth. NOTE: the public API strips admin credentials, so remote.settings
 * carries empty strings for them — keep whatever the local doc has (which is
 * also "" on the client). Real credentials live only in Firebase + the server.
 */
export function mergeRemote(local: SiteData, remote: Partial<SiteData> | null): SiteData {
  if (!remote || typeof remote !== "object") return local;
  return {
    ...local,
    ...remote,
    settings: {
      ...local.settings,
      ...(remote.settings ?? {}),
    },
    home: { ...local.home, ...(remote.home ?? {}) },
    footer: { ...local.footer, ...(remote.footer ?? {}) },
  };
}

/** Legacy keys to purge (used by the client hydration effect). */
export { LEGACY_KEYS };

// ---------------------------------------------------------------------------
// Canonical channel ordering — nav buttons NEVER shuffle
// ---------------------------------------------------------------------------
// Defaults define the canonical display order. Whatever order channels come
// back in (localStorage cache, Firebase, admin edits), every render — SSR and
// client — sorts them identically, so buttons never jump around.
const CHANNEL_ORDER = new Map(defaultChannels.map((c, i) => [c.slug as string, i]));

export function orderChannels(channels: Channel[]): Channel[] {
  return [...channels].sort(
    (a, b) =>
      (CHANNEL_ORDER.get(a.slug) ?? Number.MAX_SAFE_INTEGER) - (CHANNEL_ORDER.get(b.slug) ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name)
  );
}

/**
 * Resolve an explicit slug list to channels in that exact order (missing ones
 * skipped, duplicates ignored). Use for nav groups with a hand-picked order.
 */
export function channelsBySlugList(channels: Channel[], slugs: string[]): Channel[] {
  const bySlug = new Map(channels.map((c) => [c.slug, c]));
  const out: Channel[] = [];
  for (const s of slugs) {
    const c = bySlug.get(s);
    if (c) out.push(c);
  }
  return out;
}
