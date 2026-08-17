"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Radio, CheckCheck, History } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { useLang, t } from "@/lib/i18n";

const SEEN_KEY = "ub_notif_seen";

export default function NotificationBell() {
  const { data } = useSiteData();
  const { news, ticker } = data;
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useLang(); // re-render labels when language changes

  const alerts = ticker.slice(0, 4);
  const latest = [...news]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);
  const newestSlug = latest[0]?.slug ?? "";

  // Unread = there is news newer than what the user last saw.
  useEffect(() => {
    if (!newestSlug) return;
    let seen = "";
    try {
      seen = localStorage.getItem(SEEN_KEY) ?? "";
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time unread badge sync from localStorage
    setUnread(seen === newestSlug ? 0 : latest.length);
  }, [newestSlug, latest.length]);

  const markAllRead = () => {
    if (!newestSlug) return;
    try {
      localStorage.setItem(SEEN_KEY, newestSlug);
    } catch {
      /* ignore */
    }
    setUnread(0);
  };

  const toggle = () => {
    if (!open) {
      setOpen(true);
      markAllRead();
    } else {
      setOpen(false);
    }
  };

  // close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button type="button" onClick={toggle} className="header-icon-btn notif-btn" style={{ background: "none", border: "none", cursor: "pointer" }} aria-label={t("notifications")} title={t("notifications")}>
        <span className="notif-bell-wrap">
          <Bell size={22} className="bell-icon-lg" />
          {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
        </span>
        <span className="d-none d-md-inline">{t("notifications")}</span>
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <div className="notif-panel-title">
              <Bell size={14} /> {t("notifications")}
            </div>
            <button type="button" onClick={markAllRead} className="notif-markall">
              <CheckCheck size={13} /> {t("markAllRead")}
            </button>
          </div>
          <div className="notif-panel-body">
            {alerts.length > 0 && (
              <>
                <div className="notif-group-label">
                  <Radio size={11} style={{ display: "inline", marginRight: 4, verticalAlign: -1 }} />
                  {t("breakingAlerts")}
                </div>
                {alerts.map((a, i) => (
                  <Link
                    key={`${a}-${i}`}
                    href={`/search?q=${encodeURIComponent(a)}`}
                    className="notif-item"
                    style={{ textDecoration: "none" }}
                    onClick={() => setOpen(false)}
                  >
                    <span className="notif-dot" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="notif-item-title">{a}</p>
                    </div>
                  </Link>
                ))}
              </>
            )}

            {latest.length > 0 && (
              <>
                <div className="notif-group-label">{t("latestUpdates")}</div>
                {latest.map((n) => (
                  <a
                    key={n.slug}
                    href={`/news/${n.slug}`}
                    className="notif-item"
                    style={{ textDecoration: "none", color: "inherit" }}
                    onClick={() => setOpen(false)}
                  >
                    {n.image ? <img src={n.image} alt="" loading="lazy" decoding="async" /> : <div style={{ width: 52, height: 40, background: "var(--orange-light)", borderRadius: 5, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="notif-item-title">{n.title}</p>
                      <div className="notif-item-time">
                        <History size={10} style={{ display: "inline", marginRight: 3, verticalAlign: -1 }} />
                        {n.date}
                      </div>
                    </div>
                  </a>
                ))}
              </>
            )}

            {alerts.length === 0 && latest.length === 0 && <div className="notif-empty">{t("noAlerts")}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
