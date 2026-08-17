import fs from "node:fs";
import path from "node:path";

const CLONE = path.resolve("../bhaskar-clone");
const OUT = path.resolve("src/data");
fs.mkdirSync(OUT, { recursive: true });

// ---------- helpers ----------
function read(p) {
  return fs.readFileSync(path.join(CLONE, p), "utf8");
}

function between(html, start, end) {
  const i = html.indexOf(start);
  if (i === -1) return "";
  const j = html.indexOf(end, i + start.length);
  if (j === -1) return html.slice(i + start.length);
  return html.slice(i + start.length, j);
}

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- 1. Channels ----------
const homeHtml = read("index.html");
const channelRegex = /<a href="(?:\.\.\/)?channel\/([a-z0-9-]+)\.html"[^>]*>([\s\S]*?)<\/a>/g;
const channelMap = new Map();
let m;
while ((m = channelRegex.exec(homeHtml))) {
  const slug = m[1];
  const labelHtml = m[2];
  // icon = first <img src="...">  |  label = remaining text
  const imgMatch = labelHtml.match(/<img src="([^"]+)"/);
  const icon = imgMatch ? imgMatch[1] : null;
  const label = stripTags(labelHtml.replace(/<img[^>]*>/g, ""));
  if (!channelMap.has(slug)) {
    channelMap.set(slug, { slug, name: label || slug, icon: icon ? icon.replace(/^(\.\.\/)+/, "") : null });
  }
}

// Add any channels from the left nav not captured above
const leftNavRegex = /channel\/([a-z0-9-]+)\.html"[^>]*>([\s\S]*?)<\/a>/g;
while ((m = leftNavRegex.exec(homeHtml))) {
  const slug = m[1];
  const labelHtml = m[2];
  const imgMatch = labelHtml.match(/<img src="([^"]+)"/);
  const icon = imgMatch ? imgMatch[1] : null;
  const label = stripTags(labelHtml.replace(/<img[^>]*>/g, ""));
  if (!channelMap.has(slug)) {
    channelMap.set(slug, { slug, name: label || slug, icon: icon ? icon.replace(/^(\.\.\/)+/, "") : null });
  }
}

// channel page descriptions
for (const ch of channelMap.values()) {
  const file = path.join(CLONE, "channel", `${ch.slug}.html`);
  if (fs.existsSync(file)) {
    const html = fs.readFileSync(file, "utf8");
    const desc = html.match(/<meta name="description" content="([^"]*)"/);
    if (desc && desc[1] && !desc[1].includes("Deprecated")) ch.description = desc[1];
  }
}

const channels = [...channelMap.values()];

// ---------- 2. News articles ----------
const newsDir = path.join(CLONE, "news");
const news = [];
for (const file of fs.readdirSync(newsDir).filter((f) => f.endsWith(".html"))) {
  const html = read(`news/${file}`);
  const slug = file.replace(".html", "");
  const titleMatch = html.match(/<h1 class="article-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/);
  if (!titleMatch) continue;
  const title = stripTags(titleMatch[1]);

  // channel from breadcrumb (breadcrumb nav only, not header links)
  const crumbNav = between(html, '<nav aria-label="breadcrumb"', "</nav>");
  const crumbMatch = crumbNav.match(/channel\/([a-z0-9-]+)\.html"[^>]*>([\s\S]*?)<\/a>/);
  const channelSlug = crumbMatch ? crumbMatch[1] : null;
  const channelName = crumbMatch ? stripTags(crumbMatch[2]) : null;

  // date
  const dateMatch = html.match(/bi-calendar-event me-1"><\/i>([\s\S]*?)<\/small>/);
  let date = dateMatch ? stripTags(dateMatch[1]) : "";

  // content
  const contentHtml = between(html, '<div class="article-content mb-5">', "</div>\n\n                <div class=\"sp-slot slot-before_share");
  const content = contentHtml
    .replace(/<div class="sp-slot[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, "")
    .replace(/<div class="sp-slot[\s\S]*?<\/div>/g, "")
    .replace(/<p>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<h[23][^>]*>/g, "\n\n## ")
    .replace(/<li[^>]*>/g, "\n- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n\n");

  news.push({ slug, title, channel: channelSlug, channelName, date, content });
}

// ---------- 3. News images (from homepage + channel cards) ----------
const imgMap = new Map();
const cardRegex = /<a href="(?:\.\.\/)?news\/([a-z0-9-]+)\.html"[^>]*>[\s\S]*?<img src="([^"]+)"[\s\S]*?<\/a>/g;
for (const html of [homeHtml, read("latest.html")]) {
  let mm;
  while ((mm = cardRegex.exec(html))) {
    const slug = mm[1];
    const src = mm[2].replace(/^(\.\.\/)+/, "");
    if (!src.startsWith("http") && !imgMap.has(slug)) imgMap.set(slug, src);
  }
}

for (const n of news) {
  n.image = imgMap.get(n.slug) || null;
}

// ---------- 4. Web stories ----------
const storiesHtml = read("web-stories/index.html");
const stories = [];
const storyRegex = /<a href="(?:\.\.\/)?(web-stories\/[^"]+|#)"[^>]*>([\s\S]*?)<\/a>/g;
let sm;
while ((sm = storyRegex.exec(storiesHtml))) {
  const block = sm[2];
  const titleMatch = block.match(/<h[56][^>]*>([\s\S]*?)<\/h[56]>/);
  const imgMatch = block.match(/<img src="([^"]+)"/);
  const title = titleMatch ? stripTags(titleMatch[1]) : "";
  const img = imgMatch ? imgMatch[1].replace(/^(\.\.\/)+/, "") : null;
  if (title || img) stories.push({ title, image: img, url: sm[1] });
}

// ---------- 5. Breaking ticker items ----------
const ticker = [];
const tickerRegex = /ticker-item">([\s\S]*?)<\/a>/g;
while ((m = tickerRegex.exec(homeHtml))) ticker.push(stripTags(m[1]));

// ---------- 6. Trending searches ----------
const trending = [];
const trendingRegex = /trending-tag">([\s\S]*?)<i class="bi bi-chevron-right"><\/i><\/a>/g;
while ((m = trendingRegex.exec(homeHtml))) trending.push(stripTags(m[1]));

// ---------- write ----------
fs.writeFileSync(
  path.join(OUT, "channels.ts"),
  `// Auto-generated from clone. Channels with icon + name.\nexport type Channel = {\n  slug: string;\n  name: string;\n  icon: string | null;\n  description?: string;\n};\n\nexport const channels: Channel[] = ${JSON.stringify(channels, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OUT, "news.ts"),
  `// Auto-generated from clone. All news articles.\nexport type NewsArticle = {\n  slug: string;\n  title: string;\n  channel: string | null;\n  channelName: string | null;\n  date: string;\n  content: string;\n  image: string | null;\n};\n\nexport const news: NewsArticle[] = ${JSON.stringify(news, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OUT, "stories.ts"),
  `// Auto-generated from clone. Web stories.\nexport type WebStory = {\n  title: string;\n  image: string | null;\n  url: string;\n};\n\nexport const stories: WebStory[] = ${JSON.stringify(stories, null, 2)};\n`
);

fs.writeFileSync(
  path.join(OUT, "site.ts"),
  `// Auto-generated from clone. Site-wide config.\nexport const siteConfig = {\n  name: "Updated Bharat",\n  tagline: "Your Trusted News Source",\n  logo: "",\n  ticker: ${JSON.stringify(ticker, null, 2)},\n  trending: ${JSON.stringify(trending, null, 2)},\n  adSlots: {\n    afterTitle: "",\n    afterAuthor: "",\n    inArticle: "",\n    beforeShare: "",\n  },\n  social: {\n    facebook: "https://facebook.com",\n    youtube: "https://youtube.com",\n    instagram: "https://instagram.com",\n    twitter: "https://twitter.com",\n  },\n};\n`
);

console.log(`✅ channels: ${channels.length}`);
console.log(`✅ news: ${news.length}`);
console.log(`✅ stories: ${stories.length}`);
console.log(`✅ ticker: ${ticker.length}`);
console.log(`✅ trending: ${trending.length}`);
