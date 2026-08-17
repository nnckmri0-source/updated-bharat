"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, BookmarkX } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";
import BhaskarRow from "@/components/BhaskarRow";

const STORAGE_KEY = "savedNews";

function readSaved(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function BookmarksPage() {
  useLang(); // re-render labels on language switch
  // Hydrate from localStorage after first paint (SSR + first client render show the
  // empty state so the HTML always matches; saved items appear right after mount).
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration from localStorage after first paint
    setSavedSlugs(readSaved());
    const onStorage = () => setSavedSlugs(readSaved());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const { data } = useSiteData();
  const saved = data.news.filter((n) => savedSlugs.includes(n.slug));

  return (
    <div className="container" style={{ maxWidth: 900, margin: "0 auto", padding: "24px 0" }}>
      <div className="widget-box mb-3">
        <div className="section-head">
          <div className="section-head-title">
            <Bookmark size={15} /> {t("bookmarks")}
          </div>
        </div>
        <div style={{ padding: 16 }}>
          {saved.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <BookmarkX size={40} style={{ color: "var(--text-light)", margin: "0 auto 12px", display: "block" }} />
              <p style={{ color: "var(--text-muted)", margin: "0 0 4px" }}>No saved stories yet.</p>
              <p style={{ color: "var(--text-light)", fontSize: "0.85rem", margin: "0 0 16px" }}>Bookmark articles to read them later.</p>
              <Link href="/" style={{ background: "var(--orange)", color: "#fff", padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: "0.85rem", display: "inline-block" }}>
                Browse News
              </Link>
            </div>
          ) : (
            <>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>{saved.length} saved stor{saved.length > 1 ? "ies" : "y"}</p>
              {saved.map((a) => (
                <BhaskarRow key={a.slug} article={a} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
