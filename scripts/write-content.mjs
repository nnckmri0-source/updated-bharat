// Generates realistic generic-latest content for every news article and
// rewrites src/data/news.ts (preserving slugs/titles/channels/dates/images).
// Usage: node scripts/write-content.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildContent } from "./content-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const newsPath = join(__dirname, "..", "src", "data", "news.ts");

const source = readFileSync(newsPath, "utf8");
const match = source.match(/export const news: NewsArticle\[\] = (\[[\s\S]*\]);/);
if (!match) {
  console.error("Could not locate the news array in news.ts");
  process.exit(1);
}
const articles = JSON.parse(match[1]);

const updated = articles.map((a, i) => ({ ...a, content: buildContent(a.channel, a.title).join("\n\n") }));

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

export const news: NewsArticle[] = ${JSON.stringify(updated, null, 2)};
`;

writeFileSync(newsPath, out, "utf8");
console.log(`✅ Wrote real content for ${updated.length} articles → ${newsPath}`);
