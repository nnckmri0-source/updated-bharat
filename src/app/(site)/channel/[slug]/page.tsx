import { channels } from "@/data/channels";
import { fetchSanityChannels } from "@/lib/sanity";
import ChannelClient from "./ChannelClient";

export async function generateStaticParams() {
  const local = channels.filter((c) => c.slug !== "0").map((c) => ({ slug: c.slug }));
  try {
    const sanity = await fetchSanityChannels();
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
    const c = channels.find((ch) => ch.slug === p.slug);
    return { title: c?.name ?? "Channel", description: c?.description ?? undefined };
  });
}

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ChannelClient slug={slug} />;
}
