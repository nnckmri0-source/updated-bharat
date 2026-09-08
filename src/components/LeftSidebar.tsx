"use client";

import Link from "next/link";
import { Home, Flame } from "lucide-react";
import { useSiteData, channelsBySlugList } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";
import { SocialButtons } from "@/components/SocialRow";
import CategoryIcon from "@/components/CategoryIcon";

export default function LeftSidebar() {
  useLang(); // re-render labels on language switch
  const { data } = useSiteData();
  const { channels, settings } = data;

  // Fixed display order — buttons never shuffle when data loads from Firebase.
  const mainChannels = channelsBySlugList(channels, [
    "top-news", "local", "election-2026", "ipl-2026", "bhaskar-khaas", "db-original", "sports", "entertainment", "jobs-education", "business", "finance", "lifestyle", "jeevan-mantra", "women", "national", "international", "rashifal", "tech-auto", "fake-news-expose", "opinion", "madhurima", "magazine", "utility", "happy-life",
  ]);
  const stateChannels = channelsBySlugList(channels, ["madhya-pradesh", "uttar-pradesh", "rajasthan", "bihar"]);
  const topStories = [...data.news].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4);

  return (
    <aside className="left-sidebar d-none d-md-block">
      <Link href="/" className="left-nav-item">
        <span className="nav-icon">
          <Home size={18} style={{ color: "var(--orange)" }} />
        </span>{" "}
        {t("home")}
      </Link>
      {mainChannels.map((c) => (
        <Link key={c.slug} href={`/channel/${c.slug}`} className="left-nav-item" style={{ color: "inherit", textDecoration: "none" }}>
          <span className="nav-icon"><CategoryIcon slug={c.slug} size={16} /></span> {c.name}
        </Link>
      ))}
      <hr style={{ borderColor: "var(--border)", margin: "8px 14px" }} />
      {stateChannels.map((c) => (
        <Link key={c.slug} href={`/channel/${c.slug}`} className="left-nav-item" style={{ color: "inherit", textDecoration: "none" }}>
          <span className="nav-icon"><CategoryIcon slug={c.slug} size={16} /></span> {c.name}
        </Link>
      ))}

      <div className="sidebar-app-section">
        <div className="sidebar-app-label">{t("followUs")}</div>
        <SocialButtons social={settings.social} />
      </div>

      {/* Top Stories — fills the left column space with useful content */}
      <div className="sidebar-app-label" style={{ marginTop: 16 }}>
        <Flame size={11} style={{ display: "inline", marginRight: 4, verticalAlign: -1, color: "var(--orange)" }} />
        {t("topNews")}
      </div>
      <div style={{ padding: "0 10px" }}>
        {topStories.map((s) => (
          <Link
            key={s.slug}
            href={`/news/${s.slug}`}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              padding: "7px 4px",
              textDecoration: "none",
              color: "inherit",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {s.image ? (
              <img src={s.image} alt="" style={{ width: 42, height: 32, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} loading="lazy" decoding="async" />
            ) : (
              <div style={{ width: 42, height: 32, background: "var(--orange-light)", borderRadius: 4, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.3, WebkitLineClamp: 2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
              {s.title}
            </span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
