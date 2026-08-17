"use client";

import { ChevronRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import type { NewsArticle } from "@/data/news";

export default function BhaskarRow({ article }: { article: NewsArticle }) {
  const share = () => {
    const url = `${window.location.origin}/news/${article.slug}`;
    if (navigator.share) {
      navigator.share({ title: article.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => alert("Link copied!"));
    }
  };

  return (
    <div className="bhaskar-news-card py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a href={`/news/${article.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
            <h3 className="news-row-title mb-2" style={{ fontSize: "1rem", lineHeight: 1.4, WebkitLineClamp: 3 }}>
              {article.title}
            </h3>
          </a>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            {article.channelName ? (
              <a href={`/channel/${article.channel}`} className="badge rounded-pill" style={{ fontSize: "0.72rem", fontWeight: 600, background: "#fff", border: "1px solid #ddd", color: "var(--text-muted)", padding: "3px 12px", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                {article.channelName} <ChevronRight size={9} />
              </a>
            ) : (
              <span />
            )}
            <button type="button" onClick={share} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
              <span style={{ color: "#25D366", display: "inline-flex" }}>
                <WhatsAppIcon size={17} />
              </span>
              Share
            </button>
          </div>
        </div>
        {article.image && (
          <div style={{ flexShrink: 0, position: "relative" }}>
            <a href={`/news/${article.slug}`}>
              <img src={article.image} alt="" style={{ width: 105, height: 75, objectFit: "cover", borderRadius: 8 }} loading="lazy" decoding="async" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
