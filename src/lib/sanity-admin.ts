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
async function toImageField(
  src: string | null | undefined,
  label: string,
  extra?: Record<string, string>
): Promise<{ _type: "image"; asset: { _type: "reference"; _ref: string }; alt?: string; caption?: string } | undefined> {
  if (!src) return undefined;
  try {
    let assetId: string;
    if (src.startsWith("data:")) {
      const m = src.match(/^data:([^;]+);base64,(.*)$/);
      if (!m) return undefined;
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes as unknown as BlobPart], { type: m[1] || "image/png" });
      const asset = await client().assets.upload("image", blob, { contentType: m[1] || "image/png", filename: `${label}.png` });
      assetId = asset._id;
    } else {
      const asset = await client().assets.upload("image", src as never, { contentType: "image/jpeg", filename: `${label}.jpg` });
      assetId = asset._id;
    }
    const out: Record<string, unknown> = { _type: "image", asset: { _type: "reference", _ref: assetId } };
    if (extra?.alt) out.alt = extra.alt;
    if (extra?.caption) out.caption = extra.caption;
    return out as { _type: "image"; asset: { _type: "reference"; _ref: string } };
  } catch {
    return undefined;
  }
}

/** Parse HTML (from rich editor) → Portable Text blocks. Falls back to plain-text splitter. */
function htmlToPortableText(html: string): unknown[] {
  const src = String(html ?? "").trim();
  if (!src) return [];
  // If no HTML tags, use legacy plain splitter
  if (!/<(h1|h2|h3|strong|em|u|s|a|figure|blockquote|p|br)[\s>]/i.test(src)) {
    return contentToPortableText(src);
  }
  // Browser: use DOMParser to correctly handle nesting
  try {
    const doc = new DOMParser().parseFromString(`<div>${src}</div>`, "text/html");
    const container = doc.body.firstElementChild as HTMLElement | null;
    if (!container) return contentToPortableText(src);
    const blocks: unknown[] = [];
    const walkInline = (el: Node): Array<Record<string, unknown>> => {
      const out: Array<Record<string, unknown>> = [];
      for (const node of Array.from(el.childNodes)) {
        if (node.nodeType === 3) {
          const t = node.textContent ?? "";
          if (t) out.push({ _type: "span", _key: `s-${Math.random().toString(36).slice(2, 7)}`, text: t, marks: [] });
        } else if (node.nodeType === 1) {
          const e = node as HTMLElement;
          const tag = e.tagName.toLowerCase();
          if (tag === "strong" || tag === "b") {
            walkInline(e).forEach((s) => { (s.marks as string[]).push("strong"); out.push(s); });
          } else if (tag === "em" || tag === "i") {
            walkInline(e).forEach((s) => { (s.marks as string[]).push("em"); out.push(s); });
          } else if (tag === "u") {
            walkInline(e).forEach((s) => { (s.marks as string[]).push("underline"); out.push(s); });
          } else if (tag === "s" || tag === "strike") {
            walkInline(e).forEach((s) => { (s.marks as string[]).push("strike-through"); out.push(s); });
          } else if (tag === "a") {
            const href = e.getAttribute("href") || "";
            const key = `lnk-${Math.random().toString(36).slice(2, 7)}`;
            // link annotation will be added to markDefs; children keep mark = key
            // For simplicity store markDefs per block later
            const spans = walkInline(e);
            spans.forEach((s) => { (s.marks as string[]).push(key); out.push(s); });
            // attach def via a property on out array (handled by caller)
            (out as unknown as Record<string, unknown>).__linkDefs = (out as unknown as Record<string, unknown>).__linkDefs as unknown[] ?? [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((out as any).__linkDefs as unknown[]).push({ _key: key, _type: "link", href });
          } else if (tag === "br") {
            out.push({ _type: "span", _key: `s-${Math.random().toString(36).slice(2, 7)}`, text: "\n", marks: [] });
          } else {
            // unknown inline: recurse
            out.push(...walkInline(e));
          }
        }
      }
      return out;
    };
    for (const child of Array.from(container.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "blockquote" || tag === "p") {
        const style = tag === "h1" ? "h1" : tag === "h2" ? "h2" : tag === "h3" ? "h3" : tag === "blockquote" ? "blockquote" : "normal";
        const spans = walkInline(child);
        // extract link defs
        const linkDefs = (spans as unknown as Record<string, unknown>).__linkDefs as unknown[] | undefined;
        // filter out __linkDefs prop
        const cleanSpans = spans.map((s) => { const { __linkDefs: _, ...rest } = s as Record<string, unknown> & { __linkDefs?: unknown }; return rest; });
        const defs = (linkDefs ?? []) as unknown[];
        // if spans empty but element had text directly
        if (cleanSpans.length === 0 && child.textContent?.trim()) {
          cleanSpans.push({ _type: "span", _key: `s-${Math.random().toString(36).slice(2, 7)}`, text: child.textContent.trim(), marks: [] });
        }
        if (cleanSpans.length) {
          blocks.push({
            _type: "block",
            _key: `blk-${Math.random().toString(36).slice(2, 9)}`,
            style,
            markDefs: defs,
            children: cleanSpans.map((c) => ({ _type: "span", _key: (c as Record<string, unknown>)._key, text: (c as Record<string, unknown>).text, marks: (c as Record<string, unknown>).marks })),
          });
        }
      } else if (tag === "figure") {
        const img = child.querySelector("img");
        const cap = child.querySelector("figcaption");
        const srcAttr = img?.getAttribute("src") ?? "";
        const altAttr = img?.getAttribute("alt") ?? "";
        if (srcAttr) {
          // For now push a placeholder block; actual image asset upload happens async.
          // We embed the URL in a temporary block that will be replaced with image type after upload.
          blocks.push({ _type: "__tmpImage", _key: `img-${Math.random().toString(36).slice(2, 9)}`, url: srcAttr, alt: altAttr, caption: cap?.textContent?.trim() ?? "" } as unknown);
        }
      } else if (tag === "ul" || tag === "ol") {
        // list items → each li as a block with bullet
        for (const li of Array.from(child.querySelectorAll("li"))) {
          const spans = walkInline(li);
          blocks.push({
            _type: "block",
            _key: `blk-${Math.random().toString(36).slice(2, 9)}`,
            style: "normal",
            listItem: tag === "ul" ? "bullet" : "number",
            children: spans.map((c) => ({ _type: "span", _key: (c as Record<string, unknown>)._key, text: (c as Record<string, unknown>).text, marks: (c as Record<string, unknown>).marks })),
          });
        }
      } else if (tag === "div" && child.querySelector("iframe")) {
        const iframe = child.querySelector("iframe") as HTMLIFrameElement | null;
        const srcAttr = iframe?.getAttribute("src") ?? "";
        // try to recover youtube url
        const ytMatch = srcAttr.match(/youtube\.com\/embed\/([\w-]+)/);
        if (ytMatch) blocks.push({ _type: "youtube", _key: `yt-${Math.random().toString(36).slice(2, 9)}`, url: `https://www.youtube.com/watch?v=${ytMatch[1]}` });
      } else {
        // fallback: treat as paragraph
        const spans = walkInline(child);
        if (spans.length) {
          blocks.push({
            _type: "block",
            _key: `blk-${Math.random().toString(36).slice(2, 9)}`,
            style: "normal",
            children: spans.map((c) => ({ _type: "span", _key: (c as Record<string, unknown>)._key, text: (c as Record<string, unknown>).text, marks: (c as Record<string, unknown>).marks })),
          });
        }
      }
    }
    // Resolve __tmpImage blocks: upload sync? For now keep as image blocks with external URL placeholder (sanity-admin will upload)
    return blocks;
  } catch {
    return contentToPortableText(src);
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
    const cover = await toImageField(article.image, `cover-${article.slug}`, {
      alt: article.imageAlt ?? "",
      caption: article.imageCaption ?? "",
    });
    const channel = channelSlug ? { _type: "reference" as const, _ref: `channel-${channelSlug}` } : undefined;
    // Build body: if content looks like HTML, use htmlToPortableText, else legacy
    let body: unknown[] = [];
    const raw = String(article.content ?? "");
    if (/<(h1|h2|h3|figure|strong|em|a|blockquote)[\s>]/i.test(raw)) {
      body = htmlToPortableText(raw);
      // Upload any embedded __tmpImage figures
      const resolved: unknown[] = [];
      for (const b of body) {
        const blk = b as Record<string, unknown>;
        if (blk._type === "__tmpImage") {
          const img = await toImageField(String(blk.url ?? ""), `inline-${article.slug}-${Math.random().toString(36).slice(2, 6)}`, {
            alt: String(blk.alt ?? ""),
            caption: String(blk.caption ?? ""),
          });
          if (img) {
            resolved.push({ _type: "image", _key: blk._key, asset: img.asset, alt: (img as Record<string, unknown>).alt, caption: (img as Record<string, unknown>).caption });
          }
        } else {
          resolved.push(b);
        }
      }
      body = resolved;
    } else {
      body = contentToPortableText(raw);
    }
    await client().createOrReplace({
      _id: `article-${article.slug}`,
      _type: "article",
      title: article.title,
      slug: { _type: "slug", current: article.slug },
      channel,
      description: article.description ?? "",
      date: new Date().toISOString(),
      coverImage: cover,
      body,
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
// Web stories (now with slides + slug for /visualstories viewer)
// ---------------------------------------------------------------------------
export async function upsertSanityStory(s: WebStory): Promise<boolean> {
  if (!getSanityToken()) return false;
  try {
    const image = await toImageField(s.image, `story-${s.id}`);
    const slugVal = s.slug?.trim() || s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
    // Upload slides
    const slides: unknown[] = [];
    if (Array.isArray(s.slides)) {
      for (let idx = 0; idx < s.slides.length; idx++) {
        const sl = s.slides[idx];
        const img = await toImageField(sl.image, `story-${s.id}-slide-${idx}`);
        if (!img) continue;
        slides.push({
          _type: "slide",
          _key: `slide-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          image: img,
          title: sl.title ?? "",
          caption: sl.caption ?? "",
          alt: sl.alt ?? "",
        });
      }
    }
    await client().createOrReplace({
      _id: `story-${s.id}`,
      _type: "story",
      title: s.title || "Web Story",
      slug: slugVal ? { _type: "slug", current: slugVal } : undefined,
      category: s.category ?? undefined,
      description: s.description ?? undefined,
      image,
      slides: slides.length ? slides : undefined,
      link: s.url && s.url !== "/web-stories" && !s.url.startsWith("/visualstories") ? s.url : undefined,
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
