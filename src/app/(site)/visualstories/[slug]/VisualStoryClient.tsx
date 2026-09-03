"use client";

import Link from "next/link";
import { useSiteData } from "@/lib/store";
import VisualStoryViewer from "@/components/VisualStoryViewer";
import { FileQuestion } from "lucide-react";

export default function VisualStoryClient({ slug }: { slug: string }) {
  const { data } = useSiteData();
  const story = data.stories.find((s) => s.slug === slug) ?? data.stories.find((s) => s.id === slug);

  if (!story) {
    return (
      <div className="widget-box" style={{ padding: 60, textAlign: "center", maxWidth: 600, margin: "40px auto" }}>
        <FileQuestion size={44} style={{ color: "var(--text-light)", margin: "0 auto 14px", display: "block" }} />
        <h2 style={{ fontWeight: 800, margin: "0 0 6px" }}>Story not found</h2>
        <p style={{ color: "var(--text-muted)", margin: "0 0 18px" }}>This visual story may have been removed.</p>
        <Link href="/visualstories" style={{ background: "var(--orange)", color: "#fff", padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: "0.85rem", display: "inline-block" }}>
          Back to Visual Stories
        </Link>
      </div>
    );
  }

  return <VisualStoryViewer story={story} />;
}
