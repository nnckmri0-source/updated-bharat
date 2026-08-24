import { news } from "@/data/news";
import { stories as defaultStories } from "@/data/stories";
import { fetchSanitySlugs } from "@/lib/content-source";
import { createClient } from "@sanity/client";
import VisualStoryClient from "./VisualStoryClient";

export async function generateStaticParams() {
  const local = defaultStories.map((s) => ({ slug: (s as unknown as Record<string, unknown>).slug as string })).filter((x) => x.slug).map((x) => ({ slug: x.slug }));
  // also include news slugs for fallback? visualstories only for stories
  try {
    const client = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "dz286cjq", dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production", apiVersion: "2024-01-01", useCdn: true });
    const rows = await client.fetch<Array<{ slug: string }>>(`*[_type == "story" && defined(slug.current)]{ "slug": slug.current }`);
    const seen = new Set(local.map((l) => l.slug));
    for (const r of rows ?? []) if (r.slug && !seen.has(r.slug)) { local.push({ slug: r.slug }); seen.add(r.slug); }
  } catch { /* offline */ }
  return local.length ? local : [{ slug: "demo-story" }];
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then((p) => ({ title: p.slug.replace(/-/g, " "), description: `Visual Story — ${p.slug}` }));
}

export default async function VisualStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <VisualStoryClient slug={slug} />;
}
