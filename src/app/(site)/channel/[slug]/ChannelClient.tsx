"use client";

import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";

// per-channel gradient (from original site)
const gradients: Record<string, string> = {
  entertainment: "linear-gradient(135deg, #FF9F1C 0%, #E63946 100%)",
  politics: "linear-gradient(135deg, #E63946 0%, #1D3557 100%)",
  business: "linear-gradient(135deg, #4361EE 0%, #3A0CA3 100%)",
  sports: "linear-gradient(135deg, #2EC4B6 0%, #0077B6 100%)",
  technology: "linear-gradient(135deg, #7209B7 0%, #1D3557 100%)",
  health: "linear-gradient(135deg, #06D6A0 0%, #2A9D8F 100%)",
  world: "linear-gradient(135deg, #1D3557 0%, #457B9D 100%)",
  education: "linear-gradient(135deg, #F77F00 0%, #BC6C25 100%)",
  lifestyle: "linear-gradient(135deg, #BC6C25 0%, #283618 100%)",
  science: "linear-gradient(135deg, #283618 0%, #2A9D8F 100%)",
};

export default function ChannelClient({ slug }: { slug: string }) {
  useLang(); // re-render labels on language switch
  const { data } = useSiteData();
  const { channels, news } = data;
  const channel = channels.find((c) => c.slug === slug);

  if (!channel) {
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
  const gradient = gradients[slug] ?? "linear-gradient(135deg, #f47216 0%, #1a1a2e 100%)";
  // deterministic view count derived from slug so render stays pure
  const viewsFor = (s: string) => (s.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 90) + 10;

  return (
    <div className="container" style={{ maxWidth: 1300, margin: "0 auto", padding: "20px 0" }}>
      {/* Premium Channel Header */}
      <div
        style={{
          background: gradient,
          color: "#fff",
          borderRadius: 16,
          padding: "32px 28px",
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 25px rgba(0,0,0,.15)",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ background: "#fff", color: "#333", padding: "6px 14px", borderRadius: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.7rem", display: "inline-block", marginBottom: 12 }}>
            {t("topicChannel")}
          </span>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>{channel.name}</h1>
          {channel.description && <p style={{ opacity: 0.9, fontWeight: 500, maxWidth: 600, margin: 0 }}>{channel.description}</p>}
        </div>
      </div>

      {/* News Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
        {items.map((a) => (
          <div key={a.slug} className="news-card" style={{ border: "none", boxShadow: "var(--shadow)", borderRadius: 12, overflow: "hidden", background: "var(--surface)", position: "relative" }}>
            <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
              <a href={`/news/${a.slug}`} style={{ display: "block", width: "100%", height: "100%" }}>
                {a.image ? (
                  <img src={a.image} alt={a.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" decoding="async" />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--orange-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>📰</div>
                )}
              </a>
              <span style={{ position: "absolute", top: 12, left: 12, background: "#7209B7", color: "#fff", fontSize: "0.65rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
                {channel.name}
              </span>
            </div>
            <div style={{ padding: "16px 16px 14px" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.4, minHeight: "2.8em", margin: "0 0 12px" }}>
                <a href={`/news/${a.slug}`} style={{ color: "var(--text)", textDecoration: "none" }}>{a.title}</a>
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-muted)", fontSize: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={12} /> {a.date}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Eye size={12} /> {viewsFor(a.slug)}
                </span>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p style={{ color: "var(--text-muted)", gridColumn: "1 / -1", textAlign: "center", padding: "40px 0" }}>
            {t("noStoriesInChannel")}
          </p>
        )}
      </div>
    </div>
  );
}
