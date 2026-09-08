import { channels } from "@/data/channels";
import ChannelClient from "./ChannelClient";

export async function generateStaticParams() {
  return channels.filter((c) => c.slug !== "0").map((c) => ({ slug: c.slug }));
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
