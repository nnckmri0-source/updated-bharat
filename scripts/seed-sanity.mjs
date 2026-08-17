#!/usr/bin/env node
// ============================================================================
// SEED SANITY — push the site's current content into Sanity
// ----------------------------------------------------------------------------
// Usage:
//   1. Create an "Editor" API token in Sanity → API → Tokens (the default
//      "Access Manager" token can only READ). Put it in .env.local:
//        SANITY_API_TOKEN=sk...
//   2. Run:  node scripts/seed-sanity.mjs
//   3. Optional:  node scripts/seed-sanity.mjs --with-images
//      (--with-images uploads the current picsum cover images too; without it,
//      articles are seeded without covers and you add real images in Studio)
//
// The script is idempotent — run it again any time to re-sync from the data
// files. Channels get stable _ids (channel-<slug>) so article references work.
// ============================================================================

import { createClient } from "@sanity/client";
import { news } from "../src/data/news.ts";
import { channels } from "../src/data/channels.ts";
import { stories } from "../src/data/stories.ts";
import { siteConfig } from "../src/data/site.ts";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "dz286cjq";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN;
const withImages = process.argv.includes("--with-images");

if (!token) {
  console.error("❌ SANITY_API_TOKEN missing. Create an Editor token in Sanity → API → Tokens and set it in .env.local");
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: "2024-01-01", token });

/** Upload an image from a URL and return the asset document id. */
async function uploadImage(url, label) {
  try {
    const asset = await client.assets.upload("image", url, { contentType: "image/jpeg", filename: `${label}.jpg` });
    return asset._id;
  } catch {
    return null;
  }
}

/** Convert the site's plain-text content into Portable Text blocks.
 *  "IMG:url" lines → image blocks, bare YouTube URLs → youtube blocks,
 *  everything else → text blocks (paragraphs split on blank lines). */
function toPortableText(content) {
  const blocks = [];
  for (const para of String(content ?? "").split(/\n\s*\n/)) {
    const p = para.trim();
    if (!p) continue;
    if (p.startsWith("IMG:")) {
      // Inline images aren't uploaded by the seed — keep the URL as a caption
      // line so nothing is lost; admins add real inline images in Studio.
      blocks.push({ _type: "block", _key: `blk-${Math.random().toString(36).slice(2, 9)}`, style: "normal", children: [{ _type: "span", text: `[Image: ${p.slice(4)}]` }] });
    } else if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(p)) {
      blocks.push({ _type: "youtube", _key: `yt-${Math.random().toString(36).slice(2, 9)}`, url: p });
    } else {
      blocks.push({ _type: "block", _key: `blk-${Math.random().toString(36).slice(2, 9)}`, style: "normal", children: [{ _type: "span", text: p }] });
    }
  }
  return blocks;
}

const uploadedCovers = new Map();
async function ensureCover(url, slug) {
  if (!url || !withImages) return undefined;
  if (uploadedCovers.has(url)) return { _type: "image", asset: { _type: "reference", _ref: uploadedCovers.get(url) } };
  const assetId = await uploadImage(url, `cover-${slug}`);
  if (assetId) uploadedCovers.set(url, assetId);
  return assetId ? { _type: "image", asset: { _type: "reference", _ref: assetId } } : undefined;
}

let created = 0;

console.log(`Seeding ${projectId}/${dataset} …`);

// 1) Channels — stable _ids so articles can reference them
for (const c of channels.filter((ch) => ch.slug !== "0")) {
  const doc = {
    _id: `channel-${c.slug}`,
    _type: "channel",
    name: c.name,
    slug: { _type: "slug", current: c.slug },
    description: c.description ?? "",
  };
  if (c.icon && withImages) {
    const assetId = await uploadImage(c.icon, `icon-${c.slug}`);
    if (assetId) doc.icon = { _type: "image", asset: { _type: "reference", _ref: assetId } };
  }
  await client.createOrReplace(doc);
  created++;
}
console.log(`✓ channels: ${created}`);

// 2) Articles
let arts = 0;
for (const n of news) {
  const channelRef = n.channel ? { _type: "reference", _ref: `channel-${n.channel}` } : undefined;
  const cover = await ensureCover(n.image, n.slug);
  await client.createOrReplace({
    _id: `article-${n.slug}`,
    _type: "article",
    title: n.title,
    slug: { _type: "slug", current: n.slug },
    channel: channelRef,
    date: new Date().toISOString(),
    coverImage: cover,
    body: toPortableText(n.content),
    published: true,
  });
  arts++;
  if (arts % 25 === 0) console.log(`  … ${arts} articles`);
}
console.log(`✓ articles: ${arts}`);

// 3) Web stories
let st = 0;
for (const s of stories) {
  let image;
  if (withImages && s.image) {
    const assetId = await uploadImage(s.image, `story-${s.id}`);
    if (assetId) image = { _type: "image", asset: { _type: "reference", _ref: assetId } };
  }
  await client.createOrReplace({
    _id: `story-${s.id}`,
    _type: "story",
    title: s.title || "Web Story",
    image,
    link: s.url && s.url !== "/web-stories" ? s.url : undefined,
    published: true,
  });
  st++;
}
console.log(`✓ stories: ${st}`);

// 4) Ticker + trending (single document)
await client.createOrReplace({
  _id: "ticker-main",
  _type: "ticker",
  items: siteConfig.ticker.map((t) => t.trim()).filter(Boolean),
  trending: siteConfig.trending,
});
console.log("✓ ticker");

// 5) Settings singleton
await client.createOrReplace({
  _id: "settings-main",
  _type: "settings",
  name: siteConfig.name,
  tagline: siteConfig.tagline,
  footerAbout: "Get the latest news delivered straight to your inbox.",
  copyright: "All rights reserved.",
  liveUrl: "",
  social: { ...siteConfig.social },
});
console.log("✓ settings");

console.log(`\n🎉 Seed complete! ${created} channels, ${arts} articles, ${st} stories.`);
console.log("Open the Studio → https://dz286cjq.sanity.studio to review, add images, and publish daily posts.");
