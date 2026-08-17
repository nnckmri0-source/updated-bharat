"use client";

import ZorventByline from "@/components/ZorventByline";
import { useLang, t } from "@/lib/i18n";

export default function AdSlot({ label }: { label?: string }) {
  useLang(); // re-render on language switch
  const title = label || t("advertiseHere");
  return (
    <div className="text-center" style={{ margin: "16px 0", width: "100%" }}>
      <div className="ad-slot">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "65%", gap: 4 }}>
          <span className="ad-placeholder-title">{title}</span>
          <span className="ad-placeholder-sub">{t("adPlaceholder")}</span>
        </div>
        <ZorventByline />
      </div>
    </div>
  );
}
