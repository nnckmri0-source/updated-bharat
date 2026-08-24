import type { MetadataRoute } from "next";
import { createClient } from "@sanity/client";

const BASE = "https://updatedbharat.appleofeve.co.in";

export const dynamic = "force-static";

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "dz286cjq",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

async function fetchSlugs(query: string): Promise<string[]> {
  try {
    const rows = await sanityClient.fetch<{ slug: string }[]>(query);
    return (rows ?? []).map((r) => r.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [newsSlugs, channelSlugs, storySlugs] = await Promise.all([
    fetchSlugs(`*[_type == "article" && published == true] { "slug": slug.current }`),
    fetchSlugs(`*[_type == "channel"] { "slug": slug.current }`),
    fetchSlugs(`*[_type == "story" && defined(slug.current)] { "slug": slug.current }`),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/latest`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/e-newspaper`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/web-stories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/visualstories`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/search`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/bookmarks`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const newsRoutes: MetadataRoute.Sitemap = newsSlugs.map((slug) => ({
    url: `${BASE}/news/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const channelRoutes: MetadataRoute.Sitemap = channelSlugs.map((slug) => ({
    url: `${BASE}/channel/${slug}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const storyRoutes: MetadataRoute.Sitemap = storySlugs.map((slug) => ({
    url: `${BASE}/visualstories/${slug}`,
    changeFrequency: "daily" as const,
    priority: 0.75,
  }));

  return [...staticRoutes, ...newsRoutes, ...channelRoutes, ...storyRoutes];
}