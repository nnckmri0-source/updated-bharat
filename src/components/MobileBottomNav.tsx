"use client";

import Link from "next/link";
import { Home, Search, Play, Bookmark } from "lucide-react";
import { useLang, t } from "@/lib/i18n";

export default function MobileBottomNav() {
  useLang(); // re-render labels on language switch
  return (
    <nav className="mobile-bottom-nav d-md-none">
      <Link href="/" className="mobile-nav-item active">
        <Home size={18} />
        <span>{t("home")}</span>
      </Link>
      <Link href="/search" className="mobile-nav-item">
        <Search size={18} />
        <span>{t("search")}</span>
      </Link>
      <Link href="/web-stories" className="mobile-nav-item">
        <Play size={18} />
        <span>{t("stories")}</span>
      </Link>
      <Link href="/bookmarks" className="mobile-nav-item">
        <Bookmark size={18} />
        <span>{t("saved")}</span>
      </Link>
    </nav>
  );
}
