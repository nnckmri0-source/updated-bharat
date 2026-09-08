import { news } from "@/data/news";
import NewsClient from "./NewsClient";

export async function generateStaticParams() {
  return news.map((n) => ({ slug: n.slug }));
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
