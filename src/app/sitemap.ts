import type { MetadataRoute } from "next";
import { news } from "@/data/news";
import { channels } from "@/data/channels";
import { stories } from "@/data/stories";

const BASE = "https://updatedbharat.appleofeve.co.in";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/latest`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/e-newspaper`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/web-stories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/visualstories`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/search`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/bookmarks`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const newsRoutes: MetadataRoute.Sitemap = news.map((n) => ({
    url: `${BASE}/news/${n.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const channelRoutes: MetadataRoute.Sitemap = channels
    .filter((c) => c.slug !== "0")
    .map((c) => ({
      url: `${BASE}/channel/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  const storyRoutes: MetadataRoute.Sitemap = stories
    .filter((s) => (s as unknown as Record<string, unknown>).slug)
    .map((s) => ({
      url: `${BASE}/visualstories/${(s as unknown as Record<string, unknown>).slug}`,
      changeFrequency: "daily" as const,
      priority: 0.75,
    }));

  return [...staticRoutes, ...newsRoutes, ...channelRoutes, ...storyRoutes];
}
