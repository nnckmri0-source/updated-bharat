"use client";

import Link from "next/link";
import { Zap, PlayCircle } from "lucide-react";
import { useSiteData, type NewsArticle } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";
import WebStoriesRow from "@/components/WebStoriesRow";
import NewsCard from "@/components/NewsCard";
import BhaskarRow from "@/components/BhaskarRow";
import SectionHead from "@/components/SectionHead";
import AdSlot from "@/components/AdSlot";
import RightSidebar from "@/components/RightSidebar";
import PollWidget from "@/components/PollWidget";

// Magazine style: big hero (1.5fr) + 3 small thumb links (1fr) — original layout
export function MagazineWidget({ items }: { items: NewsArticle[] }) {
  const [main, ...rest] = items;
  if (!main) return null;
  return (
    <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
      <a href={`/news/${main.slug}`} className="hero-card" style={{ display: "block", minHeight: 220, textDecoration: "none" }}>
        {main.image ? <img src={main.image} alt={main.title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} loading="lazy" decoding="async" /> : <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0, background: "var(--orange-light)" }} />}
        <div className="hero-overlay">
          <div className="hero-title" style={{ fontSize: "1rem" }}>{main.title}</div>
        </div>
      </a>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rest.slice(0, 3).map((a) => (
          <a key={a.slug} href={`/news/${a.slug}`} style={{ display: "flex", gap: 8, textDecoration: "none", paddingBottom: 8, borderBottom: "1px solid var(--border)", color: "inherit" }}>
            {a.image ? <img src={a.image} alt="" style={{ width: 70, height: 50, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} loading="lazy" decoding="async" /> : <div style={{ width: 70, height: 50, background: "var(--orange-light)", borderRadius: 4, flexShrink: 0 }} />}
            <div className="news-row-title" style={{ WebkitLineClamp: 2, fontSize: "0.82rem" }}>{a.title}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Video Showcase style: dark bg, 1 big 220px card + 3 small cards with play icons — original layout
export function VideoWidget({ items }: { items: NewsArticle[] }) {
  const [big, ...small] = items;
  if (!big) return null;
  return (
    <div style={{ padding: 12, background: "#000", borderRadius: "0 0 6px 6px" }}>
      <div style={{ display: "grid", gap: 8 }}>
        <a href={`/news/${big.slug}`} className="hero-card" style={{ display: "block", height: 220, textDecoration: "none" }}>
          {big.image ? <img src={big.image} alt={big.title} style={{ height: "100%", width: "100%", objectFit: "cover", opacity: 0.8 }} loading="lazy" decoding="async" /> : <div style={{ height: "100%", width: "100%", background: "#222" }} />}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#fff" }}>
            <PlayCircle size={44} fill="rgba(255,255,255,.25)" />
          </div>
          <div className="hero-overlay">
            <div className="hero-title" style={{ fontSize: "1rem", WebkitLineClamp: 2 }}>{big.title}</div>
          </div>
        </a>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {small.slice(0, 3).map((a) => (
            <a key={a.slug} href={`/news/${a.slug}`} className="hero-card" style={{ display: "block", height: 80, textDecoration: "none" }}>
              {a.image ? <img src={a.image} alt={a.title} style={{ height: "100%", width: "100%", objectFit: "cover", opacity: 0.8 }} loading="lazy" decoding="async" /> : <div style={{ height: "100%", width: "100%", background: "#222" }} />}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#fff" }}>
                <PlayCircle size={20} fill="rgba(255,255,255,.25)" />
              </div>
              <div className="hero-overlay" style={{ padding: 8 }}>
                <div className="hero-title" style={{ fontSize: "0.65rem", WebkitLineClamp: 2, marginBottom: 0 }}>{a.title}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  useLang(); // re-render labels on language switch
  const { data } = useSiteData();
  const { news, channels, stories, home } = data;

  const byChannel = (slug: string | null) => news.filter((n) => n.channel === slug);
  const getChannelName = (slug: string | null) => channels.find((c) => c.slug === slug)?.name ?? slug ?? "";

  // Sorted newest first so fresh Firebase articles always surface even if home config is stale
  const sorted = [...news].sort((a, b) => {
    const da = new Date(a.date).getTime() || 0;
    const db = new Date(b.date).getTime() || 0;
    return db - da;
  });
  const heroArticle = news.find((n) => n.slug === home.heroMain) ?? sorted[0];
  let subFeatured = home.subFeatured
    .map((s) => news.find((n) => n.slug === s))
    .filter(Boolean) as typeof news;
  if (subFeatured.length < 3) {
    const used = new Set([heroArticle?.slug, ...subFeatured.map((n) => n.slug)]);
    subFeatured = [...subFeatured, ...sorted.filter((n) => !used.has(n.slug))].slice(0, 3);
  }
  let latestGrid = home.latestGrid
    .map((s) => news.find((n) => n.slug === s))
    .filter(Boolean) as typeof news;
  if (latestGrid.length < 6) {
    const used = new Set([heroArticle?.slug, ...subFeatured.map((n) => n.slug), ...latestGrid.map((n) => n.slug)]);
    latestGrid = [...latestGrid, ...sorted.filter((n) => !used.has(n.slug))].slice(0, 6);
  } else {
    latestGrid = latestGrid.slice(0, 6);
  }

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {/* MAIN FEED */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <WebStoriesRow stories={stories.slice(0, 6)} />

        {/* Hero Section — clean image, headline below (no overlay) */}
        {heroArticle && (
          <div className="widget-box mb-3">
            <div>
              <a href={`/news/${heroArticle.slug}`} style={{ display: "block", aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>
                {heroArticle.image ? (
                  <img src={heroArticle.image} alt={heroArticle.title} fetchPriority="high" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--orange-light)" }} />
                )}
              </a>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1.35, margin: 0, padding: "12px 14px" }}>
                <a href={`/news/${heroArticle.slug}`} style={{ color: "var(--text)", textDecoration: "none" }}>
                  {heroArticle.title}
                </a>
              </h2>
            </div>

            {/* Sub-featured posts */}
            <div className="grid-3" style={{ gap: 0, borderTop: "1px solid var(--border)" }}>
              {subFeatured.map((a, i) => (
                <a
                  key={a.slug}
                  href={`/news/${a.slug}`}
                  style={{ display: "flex", gap: 10, padding: "10px 12px", borderRight: i < 2 ? "1px solid var(--border)" : "none", textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ flexShrink: 0 }}>
                    {a.image ? (
                      <img src={a.image} alt="" style={{ width: 84, height: 58, objectFit: "cover", borderRadius: 6 }} loading="lazy" decoding="async" />
                    ) : (
                      <div style={{ width: 84, height: 58, background: "var(--orange-light)", borderRadius: 6 }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)", lineHeight: 1.35 }} className="line-clamp-3">
                      {a.title}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Latest News Grid */}
        <div className="widget-box mb-3">
          <div className="section-head">
            <div className="section-head-title">
              <Zap size={15} /> {t("latestNews")}
            </div>
            <Link href="/latest" className="section-head-more">
              {t("seeAll")} <span>›</span>
            </Link>
          </div>
          <div style={{ padding: 12 }}>
            <div className="grid-2">
              {latestGrid.map((a) => (
                <NewsCard key={a.slug} article={a} />
              ))}
            </div>
          </div>
        </div>

        <AdSlot />

        {/* Dynamic Channel Widgets — varied styles like the original site */}
        {home.widgets.map(({ slug, color, style }, wIdx) => {
          const items = byChannel(slug);
          if (items.length === 0) return null;
          return (
            <div className="widget-box mb-3" key={`${slug}-${wIdx}`}>
              <SectionHead title={getChannelName(slug)} color={color} href={`/channel/${slug}`} />
              {style === "magazine" ? (
                <MagazineWidget items={items.slice(0, 4)} />
              ) : style === "video" ? (
                <VideoWidget items={items.slice(0, 4)} />
              ) : (
                <div style={{ padding: "0 12px 12px" }}>
                  {items.slice(0, 4).map((a) => (
                    <BhaskarRow key={a.slug} article={a} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <AdSlot />

        {/* Poll — mobile/tablet (desktop shows it in the sidebar) */}
        <div className="d-lg-none">
          <PollWidget />
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <RightSidebar />
    </div>
  );
}
