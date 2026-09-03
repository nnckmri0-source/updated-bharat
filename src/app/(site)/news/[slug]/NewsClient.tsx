"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Share2, Calendar, BadgeCheck, FileQuestion } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";
import RightSidebar from "@/components/RightSidebar";
import AdSlot from "@/components/AdSlot";
import { ShareButtons } from "@/components/ShareButtons";

/** Convert any YouTube watch/shorts URL into an embeddable src. */
function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (!m) return null;
  return `https://www.youtube.com/embed/${m[1]}`;
}

/**
 * Legacy: Renders one content block: YouTube URL → embed, "IMG:url" → image, else paragraph.
 */
function ContentBlock({ block }: { block: string }) {
  const trimmed = block.trim();
  const yt = youtubeEmbed(trimmed);
  if (yt) {
    return (
      <div style={{ margin: "18px 0", borderRadius: 10, overflow: "hidden", aspectRatio: "16/9", background: "#000" }}>
        <iframe
          src={yt}
          title="Video"
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }
  if (trimmed.startsWith("IMG:")) {
    const src = trimmed.slice(4).trim();
    return (
      <div style={{ margin: "18px 0" }}>
        <img src={src} alt="" style={{ width: "100%", maxHeight: 480, objectFit: "cover", borderRadius: 10 }} loading="lazy" decoding="async" />
      </div>
    );
  }
  return <p>{trimmed}</p>;
}

function isHtmlContent(s: string): boolean {
  return /<(h1|h2|h3|figure|p|strong|em|a|blockquote|ul|ol|div)[\s>]/i.test(s);
}

function RichHtml({ html }: { html: string }) {
  // Enhance html: ensure links open new tab, add classes for images
  return <div className="rich-article" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function NewsClient({ slug }: { slug: string }) {
  useLang(); // re-render labels on language switch
  const { data } = useSiteData();
  const { news, channels, settings } = data;
  const [zoom, setZoom] = useState(1);
  const textSizeBtn = {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    display: "flex",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    cursor: "pointer" as const,
    fontSize: 12,
    fontWeight: 700,
  };

  const article = news.find((n) => n.slug === slug);

  const shareThis = async () => {
    if (!article) return;
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== "undefined" ? window.location.origin : "https://bhaskar.naws.in");
    const url = `${base}/news/${article.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: article.title, url });
      else {
        await navigator.clipboard.writeText(url);
        alert("Link copied!");
      }
    } catch {
      /* user cancelled share — ignore */
    }
  };
  if (!article) {
    return (
      <div className="widget-box" style={{ padding: 60, textAlign: "center" }}>
        <FileQuestion size={44} style={{ color: "var(--text-light)", margin: "0 auto 14px", display: "block" }} />
        <h2 style={{ fontWeight: 800, margin: "0 0 6px" }}>{t("articleNotFound")}</h2>
        <p style={{ color: "var(--text-muted)", margin: "0 0 18px" }}>This story may have been removed by the admin.</p>
        <Link href="/" style={{ background: "var(--orange)", color: "#fff", padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: "0.85rem", display: "inline-block" }}>
          {t("backHome")}
        </Link>
      </div>
    );
  }

  const channel = channels.find((c) => c.slug === article.channel);
  const related = news.filter((n) => n.channel === article.channel && n.slug !== slug).slice(0, 4);
  const useHtml = isHtmlContent(article.content);
  const paragraphs = !useHtml ? article.content.split("\n\n").filter(Boolean) : [];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== "undefined" ? window.location.origin : "https://bhaskar.naws.in");
  const shareUrl = `${baseUrl}/news/${article.slug}`;

  // Renders the real ad image when the admin uploaded one, otherwise the
  // "Advertise Here" placeholder box.
  const renderAd = (src: string, alt: string) =>
    src ? (
      <div style={{ margin: "20px 0", textAlign: "center" }}>
        <img src={src} className="img-fluid" alt={alt} style={{ maxWidth: "100%", height: "auto", borderRadius: 6 }} loading="lazy" decoding="async" />
      </div>
    ) : (
      <AdSlot />
    );

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <article className="article-wrapper">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" style={{ marginBottom: 12, fontSize: "0.8rem" }}>
            <ol style={{ display: "flex", alignItems: "center", gap: 6, listStyle: "none", margin: 0, padding: 0 }}>
              <li>
                <Link href="/" style={{ color: "var(--text-muted)" }}>Home</Link>
              </li>
              {channel && (
                <>
                  <li style={{ color: "var(--text-light)" }}>/</li>
                  <li>
                    <Link href={`/channel/${channel.slug}`} style={{ color: "#7209B7", textDecoration: "none" }}>{channel.name}</Link>
                  </li>
                </>
              )}
              <li style={{ color: "var(--text-light)" }}>/</li>
              <li style={{ color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Article</li>
            </ol>
          </nav>

          <h1 className="article-title mb-2">{article.title}</h1>
          {article.description && (
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.6, margin: "0 0 14px", borderLeft: "3px solid var(--orange)", paddingLeft: 12 }}>
              {article.description}
            </p>
          )}
          {article.image && (
            <figure style={{ margin: "0 0 16px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.image} alt={article.imageAlt ?? article.title} style={{ width: "100%", maxHeight: 520, objectFit: "cover", borderRadius: 10 }} loading="eager" decoding="async" />
              {article.imageCaption && <figcaption style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", marginTop: 6, fontStyle: "italic" }}>{article.imageCaption}</figcaption>}
            </figure>
          )}

          {/* Compact Branding Box */}
          <div className="border" style={{ borderRadius: 6, padding: 8, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, background: "var(--surface)", borderColor: "var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 38, height: 38, background: "#e63946", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                {settings.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 4, color: "var(--text)", fontSize: "0.95rem" }}>
                  {settings.name} <BadgeCheck size={13} style={{ color: "#3b82f6" }} />
                </div>
                <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  <Calendar size={11} style={{ display: "inline", marginRight: 4 }} />
                  {article.date}
                </small>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                aria-label="Decrease text size"
                title="Smaller text"
                onClick={() => setZoom((z) => Math.max(0.9, +(z - 0.1).toFixed(2)))}
                style={textSizeBtn}
              >
                A−
              </button>
              <button
                type="button"
                aria-label="Increase text size"
                title="Larger text"
                onClick={() => setZoom((z) => Math.min(1.2, +(z + 0.1).toFixed(2)))}
                style={textSizeBtn}
              >
                A+
              </button>
              <button type="button" aria-label="Share" title="Share this story" onClick={shareThis} style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Share2 size={14} />
              </button>
            </div>
          </div>

          {/* Ad slots */}
          {renderAd(settings.adSlots.afterTitle, "Advertisement")}
          {renderAd(settings.adSlots.afterAuthor, "Advertisement")}

          {/* Article Content */}
          <div className="article-content mb-5" style={{ fontSize: `${zoom}rem` }}>
            {useHtml ? (
              <>
                <RichHtml html={article.content} />
                <div style={{ marginTop: 18 }}>
                  {settings.adsenseInArticleCode ? <div dangerouslySetInnerHTML={{ __html: settings.adsenseInArticleCode }} /> : renderAd(settings.adSlots.inArticle, "Advertisement")}
                </div>
              </>
            ) : (
              paragraphs.map((p, i) => (
                <div key={i}>
                  <ContentBlock block={p} />
                  {i === 1 && (settings.adsenseInArticleCode ? <div dangerouslySetInnerHTML={{ __html: settings.adsenseInArticleCode }} /> : renderAd(settings.adSlots.inArticle, "Advertisement"))}
                </div>
              ))
            )}
          </div>

          {/* Share block */}
          <AdSlot />
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "16px 16px", marginBottom: 20, background: "var(--surface-2)" }}>              <h6 style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, color: "var(--text)", fontSize: "0.9rem" }}>
              <Share2 size={14} /> {t("shareArticle")}
            </h6>
            <ShareButtons title={article.title} url={shareUrl} />
          </div>

          {/* Related News */}
          {related.length > 0 && (
            <div className="related-section mb-5">
              <div className="section-head">
                <div className="section-head-title">{t("relatedStories")}</div>
              </div>
              <div className="grid-2" style={{ paddingTop: 12 }}>
                {related.map((r) => (
                  <div key={r.slug} style={{ display: "flex", gap: 8, padding: 8, border: "1px solid var(--border)", borderRadius: 6, height: "100%", alignItems: "center", background: "var(--surface)", minWidth: 0, overflow: "hidden" }}>
                    {r.image ? (
                      <img src={r.image} alt="" style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} loading="lazy" decoding="async" />
                    ) : (
                      <div style={{ width: 100, height: 70, background: "var(--orange-light)", borderRadius: 6, flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h6 style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.2 }}>
                        <Link href={`/news/${r.slug}`} style={{ color: "var(--text)", textDecoration: "none" }}>{r.title}</Link>
                      </h6>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                        <Clock size={10} style={{ display: "inline", marginRight: 3 }} /> {r.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>

      <RightSidebar />
    </div>
  );
}
