// Ensures every channel has at least 2 posts and every article has an image.
// 1. Channels with 0 posts get 2 new generic articles (channel-tailored titles + content)
// 2. Channels with 1 post get 1 more
// 3. Articles with a null image get one of the available /uploads/news images
// Usage: node scripts/seed-content.mjs

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildContent, SEED_TITLES, FALLBACK_TITLES } from "./content-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const newsPath = join(root, "src", "data", "news.ts");

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// --- load news + channels ---
const newsSrc = readFileSync(newsPath, "utf8");
const newsMatch = newsSrc.match(/export const news: NewsArticle\[\] = (\[[\s\S]*\]);/);
const channelsSrc = readFileSync(join(root, "src", "data", "channels.ts"), "utf8");
const channelsMatch = channelsSrc.match(/export const channels: Channel\[\] = (\[[\s\S]*\]);/);
if (!newsMatch || !channelsMatch) {
  console.error("Could not parse news.ts or channels.ts");
  process.exit(1);
}
const news = JSON.parse(newsMatch[1]);
const channels = JSON.parse(channelsMatch[1]);

// --- 1 & 2: seed posts for empty/low channels ---
const countFor = (slug) => news.filter((n) => n.channel === slug).length;
const date = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
let added = 0;

for (const ch of channels) {
  if (ch.slug === "0") continue;
  const have = countFor(ch.slug);
  const need = have === 0 ? 2 : have === 1 ? 1 : 0;
  if (need === 0) continue;
  const titles = SEED_TITLES[ch.slug] ?? FALLBACK_TITLES;
  for (let i = 0; i < need; i++) {
    const title = titles[i % titles.length];
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let k = 2;
    while (news.some((n) => n.slug === slug)) slug = `${baseSlug}-${k++}`;
    news.push({
      slug,
      title,
      channel: ch.slug,
      channelName: ch.name,
      date,
      content: buildContent(ch.slug, title).join("\n\n"),
      image: null,
    });
    added++;
  }
}
console.log(`✅ Seeded ${added} new posts (${channels.filter((c) => c.slug !== "0" && countFor(c.slug) === 0).length} channels still empty)`);

// --- 3: assign images to articles missing one ---
const imgDir = join(root, "public", "uploads", "news");
const images = readdirSync(imgDir)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .map((f) => `uploads/news/${f}`)
  .sort();

// prefer 800x500 landscape images for article cards
const landscape = images.filter((f) => f.includes("800_500") || f.includes("600_400"));
const pool = landscape.length ? landscape : images;

let assigned = 0;
const usedPerChannel = new Map();
for (const a of news) {
  if (a.image) continue;
  const used = usedPerChannel.get(a.channel) ?? new Set();
  let pick = pool.find((img) => !used.has(img));
  if (!pick) pick = pool[Math.floor(Math.random() * pool.length)];
  used.add(pick);
  usedPerChannel.set(a.channel, used);
  a.image = pick;
  assigned++;
}
console.log(`✅ Assigned images to ${assigned} articles`);

// --- write back ---
const out = `// Auto-generated from clone. All news articles.
export type NewsArticle = {
  slug: string;
  title: string;
  channel: string | null;
  channelName: string | null;
  date: string;
  content: string;
  image: string | null;
};

export const news: NewsArticle[] = ${JSON.stringify(news, null, 2)};
`;
writeFileSync(newsPath, out, "utf8");
console.log(`✅ news.ts updated — ${news.length} articles total`);
