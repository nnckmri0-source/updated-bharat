import { channels } from "@/data/channels";
import ChannelClient from "./ChannelClient";
import { getServerDoc } from "@/lib/server-doc";

export async function generateStaticParams() {
  return channels.filter((c) => c.slug !== "0").map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = channels.find((ch) => ch.slug === slug);
  if (c) return { title: c.name, description: c.description ?? undefined };
  const doc = await getServerDoc();
  const live = doc?.channels.find((ch) => ch.slug === slug);
  return { title: live?.name ?? "Channel", description: live?.description ?? undefined };
}

export default async function ChannelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getServerDoc();
  const initialChannel = doc?.channels.find((c) => c.slug === slug) ?? null;
  const initialItems = initialChannel ? doc!.news.filter((n) => n.channel === slug) : [];
  return <ChannelClient slug={slug} initialChannel={initialChannel} initialItems={initialItems} />;
}
