import Link from "next/link";
import { PlayCircle } from "lucide-react";
import type { WebStory } from "@/lib/store";

export default function WebStoriesRow({ stories }: { stories: WebStory[] }) {
  return (
    <div className="widget-box mb-3">
      <div style={{ padding: "10px 14px", borderTop: "3px solid var(--orange)", borderBottom: "1px solid var(--border)", fontWeight: 800, fontSize: "1rem", color: "var(--navy)", display: "flex", alignItems: "center", gap: 8, background: "#fff" }}>
        <PlayCircle size={15} style={{ color: "var(--orange)" }} /> Web Stories
      </div>
      <div className="stories-row">
        {stories.map((s) => (
          <Link key={s.id ?? s.title} href={s.url.startsWith("http") ? s.url : "/web-stories"} className="story-item">
            <div className="story-ring">
              {s.image ? <img src={s.image} alt={s.title} loading="lazy" decoding="async" /> : <div style={{ background: "#eee", width: "100%", height: "100%", borderRadius: 12 }} />}
            </div>
            <span className="story-label line-clamp-2">{s.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
