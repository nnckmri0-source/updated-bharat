"use client";

import Link from "next/link";
import { Clock, Share2 } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";

export default function ChannelClient({ slug }: { slug: string }) {
  useLang(); // re-render labels on language switch
  const { data, hydrated } = useSiteData();
  const { channels, news } = data;
  const channel = channels.find((c) => c.slug === slug);

  if (!channel) {
    // While the live data is still loading, show a spinner — not "not found".
    if (!hydrated) {
      return (
        <div className="container" style={{ maxWidth: 1300, margin: "0 auto", padding: "60px 16px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading…
        </div>
      );
    }
    return (
      <div className="container" style={{ maxWidth: 1300, margin: "0 auto", padding: "40px 16px", textAlign: "center" }}>
        <h2 style={{ fontWeight: 800 }}>{t("channelNotFound")}</h2>
        <p style={{ color: "var(--text-muted)" }}>This channel may have been removed by the admin.</p>
        <Link href="/" style={{ background: "var(--orange)", color: "#fff", padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: "0.85rem", display: "inline-block", marginTop: 12 }}>
          {t("backHome")}
        </Link>
      </div>
    );
  }

  const items = news.filter((n) => n.channel === slug);

  const shareArticle = async (title: string, s: string) => {
    const url = `${window.location.origin}/news/${s}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        alert("Link copied!");
      }
    } catch {
      /* user cancelled — ignore */
    }
  };

  return (
    <div className="container" style={{ maxWidth: 1300, margin: "0 auto", padding: "20px 0" }}>
      {/* Simple heading — no big gradient box */}
      <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 16px", paddingLeft: 12 }}>{channel.name}</h1>

      {/* News Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
        {items.map((a) => (
          <div key={a.slug} className="news-card" style={{ border: "none", boxShadow: "var(--shadow)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
            <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
              <a href={`/news/${a.slug}`} style={{ display: "block", width: "100%", height: "100%" }}>
                {a.image ? (
                  <img src={a.image} alt={a.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" decoding="async" />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--orange-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>📰</div>
                )}
              </a>
            </div>
            <div style={{ padding: "16px 16px 14px" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.4, minHeight: "2.8em", margin: "0 0 12px" }}>
                <a href={`/news/${a.slug}`} style={{ color: "var(--text)", textDecoration: "none" }}>{a.title}</a>
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", fontSize: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={12} /> {a.date}
                </span>
                <button
                  type="button"
                  title="Share"
                  onClick={() => void shareArticle(a.title, a.slug)}
                  style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
                >
                  <Share2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && hydrated && (
          <p style={{ color: "var(--text-muted)", gridColumn: "1 / -1", textAlign: "center", padding: "40px 0" }}>
            {t("noStoriesInChannel")}
          </p>
        )}
      </div>
    </div>
  );
}
