"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";
import BhaskarRow from "@/components/BhaskarRow";

function SearchInner() {
  useLang(); // re-render labels on language switch
  const searchParams = useSearchParams();
  const { data } = useSiteData();
  const { news } = data;
  const q = searchParams.get("q") ?? "";
  const query = q.trim().toLowerCase();

  const results = query
    ? news.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          (n.channelName ?? "").toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
      )
    : [];

  return (
    <div className="widget-box mb-3">
      <div className="section-head">
        <div className="section-head-title">
          <Search size={15} /> {query ? `${t("searchResults")}: "${q}"` : t("search")}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {!query && <p style={{ color: "var(--text-muted)", margin: 0 }}>Type something in the search box above.</p>}
        {query && results.length === 0 && <p style={{ color: "var(--text-muted)", margin: 0 }}>{t("noResults")} — &ldquo;{q}&rdquo;.</p>}
        {query && results.length > 0 && (
          <>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>{results.length} result{results.length > 1 ? "s" : ""} found</p>
            {results.map((a) => (
              <BhaskarRow key={a.slug} article={a} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="container" style={{ maxWidth: 900, margin: "0 auto", padding: "24px 0" }}>
      <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Searching…</div>}>
        <SearchInner />
      </Suspense>
    </div>
  );
}
