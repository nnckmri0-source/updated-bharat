"use client";

import { Zap } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";
import BhaskarRow from "@/components/BhaskarRow";
import RightSidebar from "@/components/RightSidebar";

export default function LatestPage() {
  useLang(); // re-render labels on language switch
  const { data } = useSiteData();
  const { news } = data;
  const sorted = [...news].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="widget-box mb-3">
          <div className="section-head">
            <div className="section-head-title">
              <Zap size={15} /> {t("latestNews")}
            </div>
          </div>
          <div style={{ padding: "0 12px 12px" }}>
            {sorted.map((a) => (
              <BhaskarRow key={a.slug} article={a} />
            ))}
          </div>
        </div>
      </div>
      <RightSidebar />
    </div>
  );
}
