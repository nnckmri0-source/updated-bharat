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
// Portable Text → HTML (preserves h1/h2/bold/italic/links) + legacy plain-text
// ---------------------------------------------------------------------------
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function portableTextToHtml(blocks: unknown[] | null | undefined): string {
  if (!Array.isArray(blocks)) return "";
  let html = "";
  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    const block = b as Record<string, unknown>;
    if (block._type === "block") {
      const style = (block.style as string) || "normal";
      const children = (block.children as Array<Record<string, unknown>>) ?? [];
      let inner = "";
      for (const ch of children) {
        let t = escapeHtml(String(ch.text ?? ""));
        const marks = (ch.marks as string[]) ?? [];
        const markDefs = (block.markDefs as Array<Record<string, unknown>>) ?? [];
        for (const m of marks) {
          if (m === "strong") t = `<strong>${t}</strong>`;
          else if (m === "em") t = `<em>${t}</em>`;
          else if (m === "underline") t = `<u>${t}</u>`;
          else if (m === "strike-through") t = `<s>${t}</s>`;
          else {
            const def = markDefs.find((d) => d._key === m);
            if (def && def._type === "link" && def.href) t = `<a href="${escapeHtml(String(def.href))}" target="_blank" rel="noopener noreferrer">${t}</a>`;
          }
        }
        inner += t;
      }
      if (!inner.trim()) continue;
      if (style === "h1") html += `<h1>${inner}</h1>\n\n`;
      else if (style === "h2") html += `<h2>${inner}</h2>\n\n`;
      else if (style === "h3") html += `<h3>${inner}</h3>\n\n`;
      else if (style === "blockquote") html += `<blockquote>${inner}</blockquote>\n\n`;
      else html += `<p>${inner}</p>\n\n`;
    } else if (block._type === "image") {
      const url = (block.asset as { url?: string } | undefined)?.url;
      if (url) {
        const alt = escapeHtml(String((block.alt as string) ?? ""));
        const caption = escapeHtml(String((block.caption as string) ?? ""));
        const src = sanityImg(url, 900) ?? url;
        html += `<figure class="article-inline-figure"><img src="${src}" alt="${alt}" loading="lazy" />${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>\n\n`;
      }
    } else if (block._type === "youtube") {
      const url = (block as { url?: string }).url;
      if (url) html += `<p>${escapeHtml(url)}</p>\n\n`;
    }
  }
  return html.trim();
}

// Legacy: Portable Text → the site's plain-text format (for backward compat)
// Blocks joined with \n\n, images as "IMG:<url>", youtube as its URL line
export function portableTextToContent(blocks: unknown[] | null | undefined): string {
  const html = portableTextToHtml(blocks);
  if (!html) return "";
  // For legacy callers that expect plain text with IMG lines: convert HTML back to IMG-like lines
  // But we keep html for new rendering; callers should use portableTextToHtml directly.
  // This fallback still extracts text + images for old storage format.
  const parts: string[] = [];
  for (const b of blocks ?? []) {
    if (!b || typeof b !== "object") continue;
    const block = b as Record<string, unknown>;
    if (block._type === "block") {
      const spans = Array.isArray(block.children) ? (block.children as { text?: string }[]).map((c) => c.text ?? "").join("") : "";
      if (spans.trim()) {
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
    description,
    "channel": channel->slug.current,
    "channelName": channel->name,
    date,
    "image": coverImage.asset->url,
    "imageAlt": coverImage.alt,
    "imageCaption": coverImage.caption,
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
    "slug": slug.current,
    title,
    category,
    description,
    "image": image.asset->url,
    "imageAlt": image.alt,
    link,
    slides[]{
      "image": image.asset->url,
      "imageAlt": image.alt,
      title,
      caption,
      alt
    }
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

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

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
      description: String((a.description as string) ?? ""),
      channel: (a.channel as string) ?? null,
      channelName: (a.channelName as string) ?? null,
      date: fmtDate(String(a.date ?? "")),
      content: portableTextToHtml(a.body as unknown[]) || portableTextToContent(a.body as unknown[]),
      image: sanityImg(a.image as string),
      imageAlt: (a.imageAlt as string) ?? null,
      imageCaption: (a.imageCaption as string) ?? null,
    }));

    const chanList: Channel[] = (channels ?? []).map((c: Record<string, unknown>) => ({
      slug: String(c.slug ?? ""),
      name: String(c.name ?? "Channel"),
      icon: sanityImg(c.icon as string, 64),
      description: String(c.description ?? ""),
    }));

    const storyList: WebStory[] = (stories ?? [])
      .map((s: Record<string, unknown>) => {
        const slug = (s.slug as string) ?? null;
        const slidesRaw = (s.slides as Array<Record<string, unknown>>) ?? [];
        const slides = slidesRaw
          .map((sl) => ({
            image: sanityImg(sl.image as string, 800),
            title: (sl.title as string) ?? null,
            caption: (sl.caption as string) ?? null,
            alt: (sl.alt as string) ?? (sl.imageAlt as string) ?? null,
          }))
          .filter((sl) => !!sl.image);
        const img = sanityImg(s.image as string, 400);
        // Only keep stories that have a slug and a valid cover image — old docs without slug/image are ignored
        if (!slug || !img) return null as unknown as WebStory;
        return {
          id: String(s.id ?? `story-${Math.random().toString(36).slice(2, 8)}`),
          slug,
          category: (s.category as string) ?? null,
          description: (s.description as string) ?? null,
          title: String(s.title ?? "Web Story"),
          url: `/visualstories/${slug}`,
          image: img,
          slides: slides.length ? slides : undefined,
        };
      })
      .filter(Boolean) as WebStory[];

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
      adminUsername: "", // login credentials never come from Sanity (local device only)
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
