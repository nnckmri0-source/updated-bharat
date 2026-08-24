"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Home,
  Search,
  Newspaper,
  Menu,
  X,
  List,
  Flame,
  Radio,
  PlayCircle,
  FileText,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useSiteData } from "@/lib/store";
import { t } from "@/lib/i18n";
import NotificationBell from "@/components/NotificationBell";
import CategoryIcon from "@/components/CategoryIcon";
import { SocialButtons } from "@/components/SocialRow";

export default function Header() {
  const { data } = useSiteData();
  const { channels, settings, ticker, trending } = data;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trendRef = useRef<HTMLDivElement | null>(null);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pause the trending marquee while the user touches/drags, resume shortly after.
  const pauseMarquee = () => {
    const el = trendRef.current;
    if (el) el.classList.add("marquee-paused");
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
  };
  const resumeMarquee = () => {
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      const el = trendRef.current;
      if (el) el.classList.remove("marquee-paused");
    }, 2500);
  };

  // channel groups for the nav
  const primaryNav = channels.filter((c) =>
    ["local", "election-2026", "ipl-2026", "db-original", "lifestyle", "science", "uttar-pradesh", "opinion", "jeevan-mantra", "jobs-education", "tech-auto", "finance", "apple"].includes(c.slug)
  );
  const leftNavAll = channels.filter((c) => c.slug !== "0" && c.slug !== "top-news");
  const leftNavTop = channels.filter((c) =>
    ["top-news", "local", "election-2026", "ipl-2026", "bhaskar-khaas", "db-original", "sports", "entertainment", "jobs-education", "business", "finance", "apple", "lifestyle", "jeevan-mantra", "women", "national", "international", "rashifal", "tech-auto", "fake-news-expose", "opinion", "madhurima", "magazine", "utility", "happy-life"].includes(c.slug)
  );
  const stateChannels = channels.filter((c) => ["madhya-pradesh", "uttar-pradesh", "rajasthan", "bihar"].includes(c.slug));

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
  };

  return (
    <>
      <div id="reading-progress" />
      <header className="site-header">
        <div style={{ maxWidth: 1560, margin: "0 auto" }}>
          {/* Top Bar */}
          <div className="header-bar">
            <div className="header-logo">
              <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {settings.logo ? (
                  <img src={settings.logo} alt={settings.name} fetchPriority="high" />
                ) : (
                  <span className="header-brand-text">{settings.name}</span>
                )}
                {settings.liveUrl ? (
                  <a href={settings.liveUrl} target="_blank" rel="noreferrer noopener" className="live-badge header-live-badge d-md-none" style={{ marginLeft: 2 }}>LIVE</a>
                ) : (
                  <span className="live-badge header-live-badge d-md-none" style={{ marginLeft: 2 }}>LIVE</span>
                )}
              </Link>
            </div>

            {/* Desktop Search */}
            <form onSubmit={runSearch} className="header-search-wrap d-none d-md-flex" style={{ flex: 1, maxWidth: 340, marginLeft: 24 }}>
              <input type="text" name="q" placeholder={t("searchPh")} value={query} onChange={(e) => setQuery(e.target.value)} />
              <button type="submit" aria-label="Search">
                <Search size={16} />
              </button>
            </form>

            {/* Nav Icons */}
            <nav className="header-nav-icons" style={{ display: "flex", alignItems: "center", marginLeft: "auto", gap: 2 }}>
              <Link href="/" className="header-icon-btn d-none d-md-flex">
                <Home size={22} />
                <span>{t("home")}</span>
              </Link>
              <button type="button" onClick={() => setSearchOpen(true)} className="header-icon-btn d-md-none" style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Search size={20} />
                <span>{t("search")}</span>
              </button>
              <Link href="/e-newspaper" className="header-icon-btn d-none d-md-flex">
                <Newspaper size={22} />
                <span>{t("epaper")}</span>
              </Link>
              <NotificationBell />
              <button type="button" onClick={() => setMobileMenuOpen(true)} className="header-icon-btn d-md-none" style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Menu size={22} />
                <span>{t("menu")}</span>
              </button>
            </nav>
          </div>

          {/* Breaking News Ticker (Desktop) */}
          <div className="d-none d-md-block">
            <div className="breaking-ticker">
              <span className="ticker-label">
                {settings.liveUrl ? (
                  <a href={settings.liveUrl} target="_blank" rel="noreferrer noopener" className="ticker-live-link">
                    <span className="live-badge">LIVE</span>
                  </a>
                ) : (
                  <span className="live-badge">LIVE</span>
                )}
                <Radio size={12} /> {t("breaking")}
              </span>
              <div className="ticker-track">
                <div className="ticker-content">
                  {[...ticker, ...ticker].map((tick, i) => (
                    <span key={i} style={{ display: "inline-flex", gap: 20 }}>
                      <span className="ticker-item">{tick}</span>
                      <span className="ticker-sep">•</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Scrolling Navs — Top News + categories */}
        <div className="mobile-top-navs d-md-none">
          <div className="mobile-cat-scroll">
            <Link href="/" className="mobile-cat-item active">
              <Flame size={12} style={{ color: "var(--orange)" }} /> {t("topNews")}
            </Link>
            {primaryNav.map((c) => (
              <a key={c.slug} href={`/channel/${c.slug}`} className="mobile-cat-item" style={{ color: "inherit", textDecoration: "none" }}>
                <CategoryIcon slug={c.slug} size={14} />
                {c.name}
              </a>
            ))}
          </div>
        </div>



        {/* Category Nav Bar (Desktop) */}
        <div className="category-nav-bar d-none d-md-block">
          <div style={{ maxWidth: 1560, margin: "0 auto" }}>
            <div className="category-nav-inner">
              <Link href="/" className="cat-nav-item active">
                <Flame size={13} /> {t("topNews")}
              </Link>
              {leftNavAll.map((c) => (
                <a key={c.slug} href={`/channel/${c.slug}`} className="cat-nav-item" style={{ color: "inherit", textDecoration: "none" }}>
                  <CategoryIcon slug={c.slug} size={13} />
                  {c.name}
                </a>
              ))}
              <Link href="/visualstories" className="cat-nav-item">
                <PlayCircle size={13} /> Visual Stories
              </Link>
              <Link href="/web-stories" className="cat-nav-item">
                <PlayCircle size={13} /> {t("webStories")}
              </Link>
              <Link href="/e-newspaper" className="cat-nav-item">
                <FileText size={13} /> {t("epaper")}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Trending Bar — outside the sticky header so it scrolls away with the page */}
      <div className="mobile-trending-wrap d-md-none">
        <span className="trending-label">{t("trending")}</span>
        <div
          className="mobile-trending-scroll"
          ref={trendRef}
          onTouchStart={pauseMarquee}
          onTouchEnd={resumeMarquee}
          onMouseDown={pauseMarquee}
          onMouseUp={resumeMarquee}
          onMouseLeave={resumeMarquee}
          onScroll={resumeMarquee}
        >
          <div className="trending-track">
            {[...trending, ...trending].map((tr, i) => (
              <Link key={i} href={`/search?q=${encodeURIComponent(tr)}`} className="mobile-trending-item">
                {tr} <ChevronRight size={10} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Offcanvas Menu */}
      {mobileMenuOpen && (
        <div className="offcanvas-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1999 }} onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className="mobile-offcanvas" style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 280, background: "var(--surface)", zIndex: 2100, transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform .25s ease", overflowY: "auto", boxShadow: mobileMenuOpen ? "0 0 30px rgba(0,0,0,.2)" : "none" }}>
        <div style={{ background: "var(--orange)", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h6 style={{ margin: 0, fontWeight: 800 }}>{settings.name}</h6>
          <button type="button" onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <div>
          <Link href="/" className="left-nav-item">
            <span className="nav-icon">
              <Home size={18} style={{ color: "var(--orange)" }} />
            </span>{" "}
            {t("home")}
          </Link>
          {leftNavTop.map((c) => (
            <a key={c.slug} href={`/channel/${c.slug}`} className="left-nav-item" style={{ color: "inherit", textDecoration: "none" }}>
              <span className="nav-icon"><CategoryIcon slug={c.slug} size={16} /></span> {c.name}
            </a>
          ))}
          <hr style={{ borderColor: "var(--border)", margin: "8px 14px" }} />
          {stateChannels.map((c) => (
            <a key={c.slug} href={`/channel/${c.slug}`} className="left-nav-item" style={{ color: "inherit", textDecoration: "none" }}>
              <span className="nav-icon"><CategoryIcon slug={c.slug} size={16} /></span> {c.name}
            </a>
          ))}

          {/* Follow (Mobile Offcanvas) */}
          <div className="sidebar-app-section" style={{ paddingBottom: 20 }}>
            <div className="sidebar-app-label">{t("followUs")}</div>
            <SocialButtons social={settings.social} />
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <div className={`mobile-search-overlay ${searchOpen ? "active" : ""}`} style={{ zIndex: 2100 }}>
        <div className="search-overlay-header">
          <button type="button" className="back-btn" onClick={() => setSearchOpen(false)} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <form onSubmit={runSearch} className="search-overlay-form">
            <input type="text" name="q" placeholder={t("searchPhMobile")} value={query} onChange={(e) => setQuery(e.target.value)} autoFocus={searchOpen} />
            <button type="submit" className="search-submit-btn" aria-label="Search">
              <Search size={16} />
            </button>
          </form>
        </div>
        <div className="search-overlay-content">
          <div className="trending-section">
            <h6 className="trending-title">{t("trending")}</h6>
            <div className="trending-tags">
              {trending.map((tr) => (
                <Link key={tr} href={`/search?q=${encodeURIComponent(tr)}`} className="trending-tag">
                  {tr} <ChevronRight size={12} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
