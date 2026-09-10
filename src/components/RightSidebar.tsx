"use client";

import Link from "next/link";
import { Flame, Newspaper, History, Users, ChevronRight, TrendingUp, Mail, Tag } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";
import ZorventByline from "@/components/ZorventByline";
import PollWidget from "@/components/PollWidget";
import NewsletterForm from "@/components/NewsletterForm";
import CategoryIcon from "@/components/CategoryIcon";
import { FacebookIcon, XIcon, InstagramIcon, YouTubeIcon, WhatsAppIcon } from "@/components/BrandIcons";

export default function RightSidebar() {
  useLang(); // re-render labels on language switch
  const { data } = useSiteData();
  const { news, settings, editions, trending, footer } = data;
  const sorted = [...news].sort((a, b) => (a.date < b.date ? 1 : -1));
  const latestNews = sorted.slice(0, 6);
  const mostRead = sorted.slice(0, 5);
  const edition = editions[0];
  const footerTags = footer.tags.slice(0, 12);

  return (
    <div className="right-sidebar d-none d-lg-block">
      {/* Trending Now */}
      <div className="widget-box mb-4">
        <div className="widget-title">
          <Flame size={15} /> {t("trendingNow")}
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 2 }}>
          {trending.slice(0, 5).map((tr, i) => (
            <Link
              key={tr}
              href={`/search?q=${encodeURIComponent(tr)}`}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", textDecoration: "none", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}
            >
              <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--orange)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 800, flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>{tr}</span>
              <ChevronRight size={13} style={{ color: "var(--text-light)" }} />
            </Link>
          ))}
        </div>
      </div>

      {/* Poll */}
      <PollWidget />

      {/* E-Paper Widget */}
      {edition && (
        <div className="widget-box mb-4">
          <div className="widget-title">
            <Newspaper size={15} /> {t("epaper")}
          </div>
          <div style={{ padding: 16, textAlign: "center" }}>
            <img src={edition.cover} alt={edition.name} style={{ maxWidth: 150, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,.15)", margin: "0 auto 12px" }} loading="lazy" decoding="async" />
            <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 4 }}>{edition.name}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginBottom: 12 }}>{edition.date}</div>
            <Link href="/e-newspaper" className="btn btn-sm" style={{ display: "block", width: "100%", fontWeight: 700, background: "var(--orange)", color: "#fff", borderRadius: 6, textAlign: "center", padding: "6px 0", fontSize: "0.8rem" }}>
              {t("readEdition")}
            </Link>
          </div>
        </div>
      )}

      {/* Latest News Widget */}
      <div className="widget-box mb-4">
        <div className="widget-title">
          <History size={15} /> {t("latestNews")}
        </div>
        <div style={{ padding: 8 }}>
          {latestNews.map((n) => (
            <div key={n.slug} className="bhaskar-news-card py-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a href={`/news/${n.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="news-row-title" style={{ fontSize: "0.85rem", lineHeight: 1.3, WebkitLineClamp: 2 }}>
                      {n.title}
                    </div>
                  </a>
                </div>
                {n.image && (
                  <div style={{ flexShrink: 0 }}>
                    <img src={n.image} alt="" style={{ width: 75, height: 55, objectFit: "cover", borderRadius: 6 }} loading="lazy" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Follow */}
      {settings.socialVisible !== false && (
      <div className="widget-box mb-4">
        <div className="widget-title">
          <Users size={15} /> {t("followUs")}
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { key: "facebook", label: "Facebook", color: "#1877f2", Icon: FacebookIcon },
            { key: "twitter", label: "X (Twitter)", color: "#000", Icon: XIcon },
            { key: "instagram", label: "Instagram", color: "#e1306c", Icon: InstagramIcon },
            { key: "whatsapp", label: "WhatsApp", color: "#25D366", Icon: WhatsAppIcon },
            { key: "youtube", label: "YouTube", color: "#ff0000", Icon: YouTubeIcon },
          ].map(({ key, label, color, Icon }) => (
            <a key={key} href={settings.social[key as keyof typeof settings.social]} target="_blank" className="d-flex" style={{ alignItems: "center", gap: 12, padding: 8, borderRadius: 6, background: `${color}1f`, textDecoration: "none" }} rel="noreferrer">
              <span style={{ color, display: "flex", alignItems: "center" }}>
                <Icon size={19} />
              </span>
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)" }}>{label}</span>
            </a>
          ))}
        </div>
      </div>
      )}

      {/* Most Read */}
      <div className="widget-box mb-4">
        <div className="widget-title">
          <TrendingUp size={15} /> Most Read
        </div>
        <div style={{ padding: 8 }}>
          {mostRead.map((n, i) => (
            <a key={n.slug} href={`/news/${n.slug}`} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 6px", textDecoration: "none", color: "inherit", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: i < 3 ? "var(--orange)" : "#e8e8e8", color: i < 3 ? "#fff" : "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.3, WebkitLineClamp: 2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>
                {n.title}
              </span>
              {n.image && (
                <img src={n.image} alt="" style={{ width: 52, height: 40, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} loading="lazy" />
              )}
            </a>
          ))}
        </div>
      </div>

      {/* Top Channels */}
      <div className="widget-box mb-4">
        <div className="widget-title">
          <Newspaper size={15} /> Top Channels
        </div>
        <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {["sports", "entertainment", "business", "technology", "health", "finance", "education", "apple"].map((slug) => {
            const c = data.channels.find((ch) => ch.slug === slug);
            if (!c) return null;
            const count = data.news.filter((n) => n.channel === slug).length;
            return (
              <a key={slug} href={`/channel/${slug}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 8, background: "var(--surface-3)", textDecoration: "none", color: "inherit", border: "1px solid var(--border)" }}>
                <CategoryIcon slug={slug} size={15} />
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text)" }}>{c.name}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--text-light)" }}>{count}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Newsletter */}
      <div className="widget-box mb-4" style={{ background: "var(--orange-light)", borderColor: "var(--orange)" }}>
        <div className="widget-title" style={{ background: "var(--orange)" }}>
          <Mail size={15} /> Newsletter
        </div>
        <div style={{ padding: 14 }}>
          <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
            Get the latest news delivered straight to your inbox. No spam, unsubscribe anytime.
          </p>
          <NewsletterForm />
        </div>
      </div>

      {/* Tags */}
      <div className="widget-box mb-4">
        <div className="widget-title">
          <Tag size={15} /> Tags
        </div>
        <div style={{ padding: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {footerTags.map((tag) => (
            <Link key={tag.title} href={tag.href} style={{ padding: "4px 10px", borderRadius: 20, background: "var(--surface-3)", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none", border: "1px solid var(--border)" }}>
              {tag.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Sidebar Ads — real AdSense code when set, placeholder otherwise */}
      <div className="widget-box mb-4 text-center" style={{ padding: 8 }}>
        {settings.adsenseSidebarCode ? (
          <div dangerouslySetInnerHTML={{ __html: settings.adsenseSidebarCode }} />
        ) : (
          <>
            <div className="ad-slot">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "65%", gap: 4 }}>
                <span className="ad-placeholder-title">{t("advertiseHere")}</span>
                <span className="ad-placeholder-sub">{t("adPlaceholder")}</span>
              </div>
              <ZorventByline />
            </div>
            <div className="ad-slot" style={{ marginTop: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "65%", gap: 4 }}>
                <span className="ad-placeholder-title">{t("advertiseHere")}</span>
                <span className="ad-placeholder-sub">{t("adPlaceholder")}</span>
              </div>
              <ZorventByline />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
