import { news } from "@/data/news";
import NewsClient from "./NewsClient";
import { getServerDoc } from "@/lib/server-doc";

export async function generateStaticParams() {
  return news.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = news.find((n) => n.slug === slug);
  if (a) {
    return {
      title: a.title,
      description: a.content.replace(/\n+/g, " ").slice(0, 155) + "…",
    };
  }
  // Fresh admin posts aren't in the static defaults — resolve live for SEO.
  const doc = await getServerDoc();
  const live = doc?.news.find((n) => n.slug === slug);
  return {
    title: live?.title ?? "Article",
    description: live ? live.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 155) + "…" : undefined,
  };
}

export default async function NewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Server snapshot of the article — first paint renders content instantly,
  // no "loading story" flash for freshly published posts.
  const doc = await getServerDoc();
  const initial = doc?.news.find((n) => n.slug === slug) ?? null;
  return <NewsClient slug={slug} initial={initial} />;
}
