"use client";

import Link from "next/link";
import { Calendar, Layers } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";

export default function WebStoriesPage() {
  useLang(); // re-render labels on language switch
  const { data } = useSiteData();
  const { stories } = data;

  return (
    <div className="container" style={{ maxWidth: 1300, margin: "0 auto", padding: "16px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0 0 6px" }}>{t("webStories")}</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: 500, margin: "0 auto", fontSize: "0.95rem" }}>Experience news visually with our curated stories</p>
        <div style={{ background: "var(--orange)", borderRadius: 20, width: 60, height: 4, margin: "12px auto 0" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {stories.map((s) => (
          <div key={s.id ?? s.title} style={{ marginBottom: 8 }}>
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.1)", aspectRatio: "4/5", marginBottom: 10 }}>
              <Link href="/web-stories" style={{ display: "block", width: "100%", height: "100%" }}>
                {s.image ? (
                  <img src={s.image} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" decoding="async" />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--orange-light)" }} />
                )}
              </Link>
              <div style={{ position: "absolute", top: 8, right: 8 }}>
                <div style={{ background: "rgba(0,0,0,.75)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Layers size={14} />
                </div>
              </div>
              {/* progress bars */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 8, display: "flex", gap: 4, background: "linear-gradient(transparent, rgba(0,0,0,.4))" }}>
                <div style={{ flex: 1, background: "rgba(255,255,255,.75)", borderRadius: 20, height: 3 }} />
                <div style={{ flex: 1, background: "rgba(255,255,255,.5)", borderRadius: 20, height: 3 }} />
                <div style={{ flex: 1, background: "rgba(255,255,255,.5)", borderRadius: 20, height: 3 }} />
                <div style={{ flex: 1, background: "rgba(255,255,255,.25)", borderRadius: 20, height: 3 }} />
              </div>
            </div>
            <div style={{ padding: "0 2px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 4px", lineHeight: 1.4, minHeight: "2.8em", overflow: "hidden" }}>
                <Link href="/web-stories" style={{ color: "var(--text)" }}>{s.title}</Link>
              </h3>
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 500 }}>
                <Calendar size={11} style={{ display: "inline", marginRight: 4 }} />
                08 May 2026
              </div>
            </div>
          </div>
        ))}
        {stories.length === 0 && (
          <p style={{ color: "var(--text-muted)", gridColumn: "1 / -1", textAlign: "center", padding: "40px 0" }}>No web stories yet.</p>
        )}
      </div>
    </div>
  );
}
