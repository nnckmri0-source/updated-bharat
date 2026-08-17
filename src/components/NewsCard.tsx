import { Clock } from "lucide-react";
import type { NewsArticle } from "@/data/news";

export default function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <div className="news-card">
      <a href={`/news/${article.slug}`}>
        {article.image ? (
          <img className="card-img" src={article.image} alt={article.title} loading="lazy" decoding="async" />
        ) : (
          <div className="card-img" style={{ background: "var(--orange-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>📰</div>
        )}
      </a>
      <div className="card-body">
        {article.channelName && (
          <span className="badge-channel" style={{ marginBottom: 5, display: "inline-block" }}>{article.channelName}</span>
        )}
        <div className="card-title">
          <a href={`/news/${article.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{article.title}</a>
        </div>
        <div className="card-meta">
          <Clock size={12} /> {article.date}
        </div>
      </div>
    </div>
  );
}
