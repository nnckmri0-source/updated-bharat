import { news } from "@/data/news";
import { fetchSanitySlugs } from "@/lib/content-source";
import NewsClient from "./NewsClient";

export async function generateStaticParams() {
  const local = news.map((n) => ({ slug: n.slug }));
  try {
    const sanity = await fetchSanitySlugs();
    const seen = new Set(local.map((l) => l.slug));
    for (const slug of sanity) {
      if (!seen.has(slug)) {
        local.push({ slug });
        seen.add(slug);
      }
    }
  } catch {
    /* offline build — local slugs only */
  }
  return local;
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then((p) => {
    const a = news.find((n) => n.slug === p.slug);
    return {
      title: a?.title ?? "Article",
      description: a ? a.content.replace(/\n+/g, " ").slice(0, 155) + "…" : undefined,
    };
  });
}

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <NewsClient slug={slug} />;
}
