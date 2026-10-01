"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";
import RightSidebar from "@/components/RightSidebar";

export default function SitePageClient({ slug }: { slug: string }) {
  useLang();
  const { data, hydrated } = useSiteData();
  const page = (data.pages ?? []).find((p) => p.slug === slug);

  if (!page) {
    if (!hydrated) {
      return (
        <div className="widget-box" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ width: 34, height: 34, border: "3px solid var(--border)", borderTopColor: "var(--orange)", borderRadius: "50%", margin: "0 auto 14px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Loading…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      );
    }
    return (
      <div className="widget-box" style={{ padding: 60, textAlign: "center" }}>
        <FileQuestion size={44} style={{ color: "var(--text-light)", margin: "0 auto 14px", display: "block" }} />
        <h2 style={{ fontWeight: 800, margin: "0 0 6px" }}>{t("pageNotFound")}</h2>
        <Link href="/" style={{ background: "var(--orange)", color: "#fff", padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: "0.85rem", display: "inline-block", marginTop: 12 }}>
          {t("backHome")}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <article className="article-wrapper">
          <nav aria-label="breadcrumb" style={{ marginBottom: 12, fontSize: "0.8rem" }}>
            <ol style={{ display: "flex", alignItems: "center", gap: 6, listStyle: "none", margin: 0, padding: 0 }}>
              <li>
                <Link href="/" style={{ color: "var(--text-muted)" }}>Home</Link>
              </li>
              <li style={{ color: "var(--text-light)" }}>/</li>
              <li style={{ color: "var(--text-muted)" }}>{page.title}</li>
            </ol>
          </nav>
          <h1 className="article-title mb-2">{page.title}</h1>
          <div className="article-content mb-5">
            <div className="rich-article" dangerouslySetInnerHTML={{ __html: page.content }} />
          </div>
        </article>
      </div>
      <RightSidebar />
    </div>
  );
}
