import { stories as defaultStories } from "@/data/stories";
import VisualStoryClient from "./VisualStoryClient";

export async function generateStaticParams() {
  const local = defaultStories
    .map((s) => ({ slug: (s as unknown as Record<string, unknown>).slug as string }))
    .filter((x) => x.slug)
    .map((x) => ({ slug: x.slug }));
  return local.length ? local : [{ slug: "demo-story" }];
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then((p) => ({ title: p.slug.replace(/-/g, " "), description: `Visual Story — ${p.slug}` }));
}

export default async function VisualStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <VisualStoryClient slug={slug} />;
}
