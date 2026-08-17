"use client";

// ============================================================================
// SANITY ADMIN WRITE LAYER
// ----------------------------------------------------------------------------
// Lets the /admin panel push edits straight into Sanity, so content changes
// are visible to EVERYONE (not just the editing browser).
//
// A built-in Editor token is bundled so the panel syncs to Sanity out of the
// box — no setup needed. A different token can still be pasted in Site
// Settings (stored in localStorage) and it overrides the built-in one.
// ============================================================================

import { createClient } from "@sanity/client";
import { portableTextToContent } from "@/lib/sanity";
import type { SiteData, NewsArticle, Channel, WebStory, Poll, EPaperEdition } from "@/lib/store";

export const SANITY_TOKEN_KEY = "bhaskar_admin_sanity_token";

/**
 * Built-in Editor token (project dz286cjq). Hard-coded so the admin panel
 * works with zero setup. NOTE: it ships inside the public JS bundle, so anyone
 * can extract it — fine for this project, but replace it with a restricted
 * token if the write token ever needs to stay private.
 */
export const DEFAULT_SANITY_TOKEN =
  "sksHYMTT1meEIWC9BW2m3y3dQb8kuoRSQtIRm18v8zmzXJaHYCKfmoZVmsf7j0rhZmbT9ZUie0jlCypTHXWFcTiFeAsfHqpOMqe6PhtPsF8NjNlFuRUYWCHihglpce3PyDGF3SJyOYO86lhUOEhoZevSSjKslZILgCWsuH1gzxJLmpxs2YU3";

export function getSanityToken(): string {
  try {
    return localStorage.getItem(SANITY_TOKEN_KEY) || DEFAULT_SANITY_TOKEN;
  } catch {
    return DEFAULT_SANITY_TOKEN;
  }
}

export function setSanityToken(t: string): void {
  try {
    if (t) localStorage.setItem(SANITY_TOKEN_KEY, t);
    else localStorage.removeItem(SANITY_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function client() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "dz286cjq",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    token: getSanityToken(),
    useCdn: false, // writes must go to the live API
  });
}

/** Upload a data:/http image to Sanity and return an image field, or undefined. */
async function toImageField(src: string | null | undefined, label: string): Promise<{ _type: "image"; asset: { _type: "reference"; _ref: string } } | undefined> {
  if (!src) return undefined;
  try {
    let assetId: string;
    if (src.startsWith("data:")) {
      // base64 → Blob upload
      const m = src.match(/^data:([^;]+);base64,(.*)$/);
      if (!m) return undefined;
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes as unknown as BlobPart], { type: m[1] || "image/png" });
      const asset = await client().assets.upload("image", blob, { contentType: m[1] || "image/png", filename: `${label}.png` });
      assetId = asset._id;
    } else {
      // URL string upload — supported at runtime by @sanity/client
      const asset = await client().assets.upload("image", src as never, { contentType: "image/jpeg", filename: `${label}.jpg` });
      assetId = asset._id;
    }
    return { _type: "image", asset: { _type: "reference", _ref: assetId } };
  } catch {
    return undefined;
  }
}

/** Convert plain-text content (paragraphs + IMG: + YouTube lines) to Portable Text. */
export function contentToPortableText(content: string): unknown[] {
  const blocks: unknown[] = [];
  for (const para of String(content ?? "").split(/\n\s*\n/)) {
    const p = para.trim();
    if (!p) continue;
    if (p.startsWith("IMG:")) {
      // Keep the URL as a caption line — admins add real inline images in Studio.
      blocks.push({
        _type: "block",
        _key: `blk-${Math.random().toString(36).slice(2, 9)}`,
        style: "normal",
        children: [{ _type: "span", text: `[Image: ${p.slice(4).trim()}]` }],
      });
    } else if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(p)) {
      blocks.push({ _type: "youtube", _key: `yt-${Math.random().toString(36).slice(2, 9)}`, url: p });
    } else {
      blocks.push({
        _type: "block",
        _key: `blk-${Math.random().toString(36).slice(2, 9)}`,
        style: "normal",
        children: [{ _type: "span", text: p }],
      });
    }
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------
export async function upsertSanityArticle(article: NewsArticle, channelSlug?: string | null): Promise<boolean> {
  const token = getSanityToken();
  if (!token) return false;
  try {
    const cover = await toImageField(article.image, `cover-${article.slug}`);
    const channel = channelSlug ? { _type: "reference" as const, _ref: `channel-${channelSlug}` } : undefined;
    await client()
      .createOrReplace({
        _id: `article-${article.slug}`,
        _type: "article",
        title: article.title,
        slug: { _type: "slug", current: article.slug },
        channel,
        date: new Date().toISOString(),
        coverImage: cover,
        body: contentToPortableText(article.content),
        published: true,
      });
    return true;
  } catch {
    return false;
  }
}

export async function deleteSanityArticle(slug: string): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    await client().delete(`article-${slug}`);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------
export async function upsertSanityChannel(c: Channel): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    const icon = await toImageField(c.icon, `icon-${c.slug}`);
    await client().createOrReplace({
      _id: `channel-${c.slug}`,
      _type: "channel",
      name: c.name,
      slug: { _type: "slug", current: c.slug },
      description: c.description ?? "",
      icon,
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteSanityChannel(slug: string): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    await client().delete(`channel-${slug}`);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Web stories
// ---------------------------------------------------------------------------
export async function upsertSanityStory(s: WebStory): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    const image = await toImageField(s.image, `story-${s.id}`);
    await client().createOrReplace({
      _id: `story-${s.id}`,
      _type: "story",
      title: s.title || "Web Story",
      image,
      link: s.url && s.url !== "/web-stories" ? s.url : undefined,
      published: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteSanityStory(id: string): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    await client().delete(`story-${id}`);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Polls
// ---------------------------------------------------------------------------
export async function upsertSanityPoll(p: Poll): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    await client().createOrReplace({
      _id: `poll-${p.id}`,
      _type: "poll",
      question: p.question,
      options: p.options,
      published: p.published,
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteSanityPoll(id: string): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    await client().delete(`poll-${id}`);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Ticker & trending (single doc)
// ---------------------------------------------------------------------------
export async function syncSanityTicker(ticker: string[], trending: string[]): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    await client().createOrReplace({
      _id: "ticker-main",
      _type: "ticker",
      items: ticker,
      trending,
    });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// E-Paper editions
// ---------------------------------------------------------------------------
export async function upsertSanityEdition(e: EPaperEdition): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    const cover = await toImageField(e.cover, `edition-${e.name}`);
    await client().createOrReplace({
      _id: `edition-${e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "edition"}`,
      _type: "edition",
      name: e.name,
      date: e.date,
      cover,
      pdf: e.pdf || undefined,
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteSanityEdition(name: string): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    await client().delete(`edition-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "edition"}`);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Settings (singleton) — name/tagline/logo/social/liveUrl/adsense/onesignal
// ---------------------------------------------------------------------------
export async function syncSanitySettings(settings: SiteData["settings"]): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    const logo = await toImageField(settings.logo, "logo");
    await client().createOrReplace({
      _id: "settings-main",
      _type: "settings",
      name: settings.name,
      tagline: settings.tagline,
      logo,
      footerAbout: settings.footerAbout,
      copyright: settings.copyright,
      liveUrl: settings.liveUrl,
      social: { ...settings.social },
      adsense: {
        autoAdClient: "",
        autoAdSlot: "",
        headerCode: settings.adsenseHeaderCode,
        inArticleCode: settings.adsenseInArticleCode,
        sidebarCode: settings.adsenseSidebarCode,
      },
      onesignal: { appId: settings.onesignalAppId },
    });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Token check / connection test
// ---------------------------------------------------------------------------
export async function testSanityConnection(token: string): Promise<{ ok: boolean; message: string }> {
  if (!token) return { ok: false, message: "No token" };
  try {
    const c = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "dz286cjq",
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2024-01-01",
      token,
      useCdn: false,
    });
    const count = await c.fetch<number>(`count(*[_type == "article"])`);
    return { ok: true, message: `Connected ✓ (${count} articles in Sanity)` };
  } catch (e) {
    return { ok: false, message: `Failed: ${(e as Error).message?.slice(0, 80)}` };
  }
}

// Re-export for convenience in admin components
export { portableTextToContent };
