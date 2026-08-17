"use client";

// ============================================================================
// SANITY — content source for the site
// ----------------------------------------------------------------------------
// The site is a static export (Netlify drag-and-drop). It fetches content from
// Sanity in the browser (client-side) so admin edits show up WITHOUT a rebuild:
//   - Homepage lists, ticker, channels, stories, polls, settings, ads → live
//   - New article/channel detail pages appear after the next rebuild
//     (generateStaticParams also pulls slugs from Sanity at build time).
// Falls back to localStorage / static defaults when Sanity is unreachable or
// still empty.
// ============================================================================

import { createClient } from "@sanity/client";
import type { SiteData, NewsArticle, Channel, WebStory, Poll, EPaperEdition } from "@/lib/store";

export const USE_SANITY = true;

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "dz286cjq";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

/** Public read client — works without a token (dataset is public). */
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: true,
});

/** Append Sanity CDN compression params: request only the size we render. */
export function sanityImg(url: string | null | undefined, w = 800): string | null {
  if (!url) return null;
  return `${url}?w=${w}&auto=format&q=70`;
}

// ---------------------------------------------------------------------------
// Portable Text → the site's plain-text format
//   blocks joined with \n\n, images as "IMG:<url>", youtube as its URL line
// ---------------------------------------------------------------------------
export function portableTextToContent(blocks: unknown[] | null | undefined): string {
  if (!Array.isArray(blocks)) return "";
  const parts: string[] = [];
  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    const block = b as Record<string, unknown>;
    if (block._type === "block") {
      const spans = Array.isArray(block.children)
        ? (block.children as { text?: string }[]).map((c) => c.text ?? "").join("")
        : "";
      if (spans.trim()) {
        // round-trip: "[Image: url]" written by the admin panel → IMG: line
        const imgMatch = spans.trim().match(/^\[Image: (.+)\]$/);
        parts.push(imgMatch ? `IMG:${imgMatch[1]}` : spans);
      }
    } else if (block._type === "image") {
      const url = (block.asset as { url?: string } | undefined)?.url;
      if (url) parts.push(`IMG:${sanityImg(url, 1200)}`);
    } else if (block._type === "youtube") {
      const url = (block as { url?: string }).url;
      if (url) parts.push(url);
    }
  }
  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// GROQ queries
// ---------------------------------------------------------------------------
const QUERIES = {
  articles: `*[_type == "article" && published == true] | order(date desc) {
    "slug": slug.current,
    title,
    "channel": channel->slug.current,
    "channelName": channel->name,
    date,
    "image": coverImage.asset->url,
    body
  }`,
  channels: `*[_type == "channel"] | order(name asc) {
    "slug": slug.current,
    name,
    "icon": icon.asset->url,
    description
  }`,
  stories: `*[_type == "story" && published == true] | order(_createdAt desc) {
    "id": _id,
    title,
    "image": image.asset->url,
    link
  }`,
  editions: `*[_type == "edition"] | order(date desc) {
    name,
    date,
    "cover": cover.asset->url,
    pdf
  }`,
  polls: `*[_type == "poll" && published == true] | order(_createdAt desc) {
    "id": _id,
    question,
    options
  }`,
  settings: `*[_type == "settings"][0] {
    name,
    tagline,
    "logo": logo.asset->url,
    footerAbout,
    copyright,
    liveUrl,
    social,
    adsense,
    onesignal
  }`,
  ticker: `*[_type == "ticker"][0] { items, trending }`,
  adSlots: `*[_type == "adSlot" && enabled == true] {
    key,
    "image": image.asset->url,
    link,
    code
  }`,
  allSlugs: `*[_type == "article" && published == true] { "slug": slug.current }`,
  channelSlugs: `*[_type == "channel"] { "slug": slug.current }`,
};

/** Fetch everything the frontend renders. Returns null when Sanity is empty/unreachable. */
export async function fetchSanitySiteData(): Promise<Partial<SiteData> | null> {
  try {
    const [articles, channels, stories, editions, polls, settings, ticker, adSlots] = await Promise.all([
      sanityClient.fetch(QUERIES.articles),
      sanityClient.fetch(QUERIES.channels),
      sanityClient.fetch(QUERIES.stories),
      sanityClient.fetch(QUERIES.editions),
      sanityClient.fetch(QUERIES.polls),
      sanityClient.fetch(QUERIES.settings),
      sanityClient.fetch(QUERIES.ticker),
      sanityClient.fetch(QUERIES.adSlots),
    ]);

    const hasAny = [articles, channels, stories, polls, ticker].some(
      (v) => Array.isArray(v) ? v.length > 0 : !!v
    );
    if (!hasAny) return null; // empty project → keep current defaults

    const news: NewsArticle[] = (articles ?? []).map((a: Record<string, unknown>) => ({
      slug: String(a.slug ?? ""),
      title: String(a.title ?? "Untitled"),
      channel: (a.channel as string) ?? null,
      channelName: (a.channelName as string) ?? null,
      date: String(a.date ?? ""),
      content: portableTextToContent(a.body as unknown[]),
      image: sanityImg(a.image as string),
    }));

    const chanList: Channel[] = (channels ?? []).map((c: Record<string, unknown>) => ({
      slug: String(c.slug ?? ""),
      name: String(c.name ?? "Channel"),
      icon: sanityImg(c.icon as string, 64),
      description: String(c.description ?? ""),
    }));

    const storyList: WebStory[] = (stories ?? []).map((s: Record<string, unknown>) => ({
      id: String(s.id ?? `story-${Math.random().toString(36).slice(2, 8)}`),
      title: String(s.title ?? "Web Story"),
      url: (s.link as string) && (s.link as string) !== "#" ? (s.link as string) : "/web-stories",
      image: sanityImg(s.image as string, 400),
    }));

    const editionList: EPaperEdition[] = (editions ?? []).map((e: Record<string, unknown>) => ({
      name: String(e.name ?? "Edition"),
      date: String(e.date ?? ""),
      cover: sanityImg(e.cover as string, 600),
      pdf: String(e.pdf ?? ""),
    }));

    const pollList: Poll[] = (polls ?? []).map((p: Record<string, unknown>) => ({
      id: String(p.id ?? `poll-${Math.random().toString(36).slice(2, 8)}`),
      question: String(p.question ?? ""),
      options: Array.isArray(p.options) ? (p.options as string[]) : [],
      published: true,
    }));

    const s = (settings ?? {}) as Record<string, unknown>;
    const social = (s.social ?? {}) as Record<string, unknown>;
    const adsense = (s.adsense ?? {}) as Record<string, unknown>;
    const onesignal = (s.onesignal ?? {}) as Record<string, unknown>;

    // adSlot docs → the same settings.adSlots shape the frontend reads
    const adMap: Record<string, { image: string | null; link: string }> = {};
    for (const ad of (adSlots ?? []) as Record<string, unknown>[]) {
      const key = String(ad.key ?? "");
      if (key) adMap[key] = { image: sanityImg(ad.image as string, 700), link: String(ad.link ?? "") };
    }
    const adSlotsOut: SiteData["settings"]["adSlots"] = {
      afterTitle: adMap.afterTitle?.image ?? "",
      afterAuthor: adMap.afterAuthor?.image ?? "",
      inArticle: adMap.inArticle?.image ?? "",
      beforeShare: adMap.beforeShare?.image ?? "",
    };

    const settingsOut: SiteData["settings"] = {
      name: String(s.name ?? ""),
      tagline: String(s.tagline ?? ""),
      logo: sanityImg(s.logo as string, 200) ?? "",
      footerAbout: String(s.footerAbout ?? ""),
      copyright: String(s.copyright ?? ""),
      adminPassword: "",
      liveUrl: String(s.liveUrl ?? ""),
      social: {
        facebook: String(social.facebook ?? ""),
        twitter: String(social.twitter ?? ""),
        instagram: String(social.instagram ?? ""),
        youtube: String(social.youtube ?? ""),
        whatsapp: String(social.whatsapp ?? ""),
      },
      adSlots: adSlotsOut,
      onesignalAppId: String(onesignal.appId ?? ""),
      adsenseHeaderCode: String(adsense.headerCode ?? ""),
      adsenseInArticleCode: String(adsense.inArticleCode ?? ""),
      adsenseSidebarCode: String(adsense.sidebarCode ?? ""),
    };

    return {
      news,
      channels: chanList,
      stories: storyList,
      editions: editionList,
      polls: pollList,
      settings: settingsOut,
      ticker: Array.isArray(ticker?.items) ? (ticker.items as string[]) : [],
      trending: Array.isArray(ticker?.trending) ? (ticker.trending as string[]) : [],
    };
  } catch {
    return null; // offline / project not ready → fall back to defaults
  }
}

/** All published article slugs (used by generateStaticParams at build time). */
export async function fetchSanitySlugs(): Promise<string[]> {
  try {
    const rows = await sanityClient.fetch<{ slug: string }[]>(QUERIES.allSlugs);
    return (rows ?? []).map((r) => r.slug).filter(Boolean);
  } catch {
    return [];
  }
}

/** All channel slugs (used by generateStaticParams at build time). */
export async function fetchSanityChannels(): Promise<string[]> {
  try {
    const rows = await sanityClient.fetch<{ slug: string }[]>(QUERIES.channelSlugs);
    return (rows ?? []).map((r) => r.slug).filter(Boolean);
  } catch {
    return [];
  }
}
