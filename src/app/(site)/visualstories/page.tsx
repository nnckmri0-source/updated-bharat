"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang } from "@/lib/i18n";

export default function VisualStoriesPage() {
  useLang();
  const { data } = useSiteData();
  const { stories } = data;

  return (
    <div className="container" style={{ maxWidth: 1300, margin: "0 auto", padding: "16px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0 0 6px" }}>Visual Stories</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: 560, margin: "0 auto", fontSize: "0.95rem" }}>Tap to experience — IndiaToday-style vertical stories with images, captions & auto-play</p>
        <div style={{ background: "var(--orange)", borderRadius: 20, width: 60, height: 4, margin: "12px auto 0" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {stories.map((s) => (
          <Link key={s.id ?? s.title} href={s.slug ? `/visualstories/${s.slug}` : s.url} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,.15)", aspectRatio: "9/16", marginBottom: 10, background: "#000" }}>
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "var(--orange-light)" }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 55%)" }} />
              <div style={{ position: "absolute", top: 8, left: 8, right: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ background: "rgba(255,255,255,.95)", color: "#111", fontSize: 9, fontWeight: 800, letterSpacing: 0.5, padding: "3px 6px", borderRadius: 4, textTransform: "uppercase" }}>{s.category ?? "Story"}</span>
                <div style={{ background: "rgba(0,0,0,.6)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", backdropFilter: "blur(4px)" }}>
                  <Layers size={12} />
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 10, color: "#fff" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, lineHeight: 1.3, margin: "0 0 4px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.title}</h3>
                {s.description && <p style={{ fontSize: "0.72rem", opacity: 0.9, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.description}</p>}
              </div>
              {/* progress bars like IndiaToday card */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 6, display: "flex", gap: 3 }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,.9)", borderRadius: 20, height: 2 }} />
                <div style={{ flex: 1, background: "rgba(255,255,255,.4)", borderRadius: 20, height: 2 }} />
                <div style={{ flex: 1, background: "rgba(255,255,255,.4)", borderRadius: 20, height: 2 }} />
              </div>
            </div>
          </Link>
        ))}
        {stories.length === 0 && <p style={{ color: "var(--text-muted)", gridColumn: "1 / -1", textAlign: "center", padding: "40px 0" }}>No visual stories yet.</p>}
      </div>
    </div>
  );
}
