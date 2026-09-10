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
        <div className="card-title">
          <a href={`/news/${article.slug}`} style={{ color: "inherit", textDecoration: "none" }}>{article.title}</a>
        </div>
      </div>
    </div>
  );
}
