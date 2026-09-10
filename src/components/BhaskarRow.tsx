"use client";

import type { NewsArticle } from "@/data/news";

export default function BhaskarRow({ article }: { article: NewsArticle }) {
  return (
    <div className="bhaskar-news-card py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a href={`/news/${article.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
            <h3 className="news-row-title" style={{ fontSize: "1rem", lineHeight: 1.4, WebkitLineClamp: 3, margin: 0 }}>
              {article.title}
            </h3>
          </a>
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
