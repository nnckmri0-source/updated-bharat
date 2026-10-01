"use client";

import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { useSiteData, DEFAULT_STORY_STYLE, type WebStory } from "@/lib/store";

const ANIM_CLASS = { none: "", fade: "story-anim-fade", slide: "story-anim-slide", zoom: "story-anim-zoom" } as const;
const FONT_CLASS = { default: "", serif: "story-font-serif", mono: "story-font-mono" } as const;

export default function WebStoriesRow({ stories }: { stories: WebStory[] }) {
  const { data } = useSiteData();
  const style = data.settings.storyStyle ?? DEFAULT_STORY_STYLE;
  const anim = ANIM_CLASS[style.animation] ?? "";
  const font = FONT_CLASS[style.font] ?? "";
  return (
    <div className="widget-box mb-3">
      <div style={{ padding: "10px 14px", borderTop: "3px solid var(--orange)", borderBottom: "1px solid var(--border)", fontWeight: 800, fontSize: "1rem", color: "var(--navy)", display: "flex", alignItems: "center", gap: 8, background: "#fff" }}>
        <PlayCircle size={15} style={{ color: "var(--orange)" }} /> Web Stories
      </div>
       <div className="stories-row">
        {stories.map((s) => (
          <Link key={s.id ?? s.title} href={s.slug ? `/visualstories/${s.slug}` : s.url.startsWith("http") ? s.url : "/web-stories"} className={`story-item ${anim}`}>
            <div className="story-ring">
              {s.image ? <img src={s.image} alt={s.title} loading="lazy" decoding="async" /> : <div style={{ background: "#eee", width: "100%", height: "100%", borderRadius: 12 }} />}
            </div>
            <span className={`story-label line-clamp-2 ${font}`}>{s.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
