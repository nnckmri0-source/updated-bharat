import SitePageClient from "./SitePageClient";
import { getServerDoc } from "@/lib/server-doc";

export async function generateStaticParams() {
  // Seed pages prerender; admin-created pages render live from the store.
  return [
    { slug: "privacy-policy" },
    { slug: "terms" },
    { slug: "contact" },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getServerDoc();
  const page = doc?.pages?.find((p) => p.slug === slug);
  return { title: page?.title ?? "Page" };
}

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SitePageClient slug={slug} />;
}
