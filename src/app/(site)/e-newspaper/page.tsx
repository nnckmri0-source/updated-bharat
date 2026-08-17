"use client";

import { Calendar, Download } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";

export default function ENewspaperPage() {
  useLang(); // re-render labels on language switch
  const { data } = useSiteData();
  const { editions } = data;

  return (
    <div className="container" style={{ maxWidth: 1300, margin: "0 auto", padding: "24px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 4px" }}>{t("epaper")}</h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Read today&apos;s edition and archives online.</p>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          <button type="button" style={{ background: "var(--orange)", color: "#fff", border: "1px solid var(--orange)", padding: "8px 18px", borderRadius: "8px 0 0 8px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>Newspapers</button>
          <button type="button" style={{ background: "#fff", color: "var(--orange)", border: "1px solid var(--orange)", padding: "8px 18px", borderRadius: "0 8px 8px 0", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>Magazines</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {editions.map((e) => (
          <div key={e.name} style={{ border: "none", boxShadow: "0 2px 10px rgba(0,0,0,.08)", borderRadius: 12, overflow: "hidden", background: "#fff", height: "100%" }}>
            <div style={{ position: "relative" }}>
              <img src={e.cover} alt={e.name} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover" }} loading="lazy" decoding="async" />
            </div>
            <div style={{ padding: 14 }}>
              <h5 style={{ fontWeight: 700, fontSize: "0.9rem", margin: "0 0 4px" }}>{e.name}</h5>
              <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", margin: "0 0 12px" }}>
                <Calendar size={11} style={{ display: "inline", marginRight: 4 }} />
                {e.date}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href={e.pdf} target="_blank" rel="noreferrer" style={{ background: "var(--orange)", color: "#fff", borderRadius: 20, padding: "7px 0", textAlign: "center", fontSize: "0.8rem", fontWeight: 600 }}>
                  Read Online
                </a>
                <a href={e.pdf} download style={{ background: "var(--surface-2)", color: "var(--text)", borderRadius: 20, padding: "7px 0", textAlign: "center", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Download size={12} /> Download
                </a>
              </div>
            </div>
          </div>
        ))}
        {editions.length === 0 && (
          <p style={{ color: "var(--text-muted)", gridColumn: "1 / -1", textAlign: "center", padding: "40px 0" }}>No editions published yet.</p>
        )}
      </div>
    </div>
  );
}
