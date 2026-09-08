"use client";

// ============================================================================
// FIREBASE BACKEND — Next.js API routes + Firebase Admin SDK (server-side)
// ----------------------------------------------------------------------------
// The whole SiteData document lives at the `site` node in Firebase RTDB and is
// accessed through our own backend:
//   - GET  /api/site   → public read (visitors)
//   - PUT  /api/site   → admin-gated write (HttpOnly session cookie; the server
//                        verifies the admin login against Firebase via the
//                        Admin SDK, which bypasses security rules)
//   - onValue listener → realtime push to every open tab (client SDK, read-only)
// - Site: defaults → localStorage cache → GET /api/site → LIVE listener.
// - Admin: every save (update()) writes localStorage AND PUTs to /api/site.
// - No Firebase config in env? The site quietly falls back to localStorage
//   (offline dev / first setup) and nothing breaks.
// ============================================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  buildDefaults,
  mergeStored,
  mergeRemote,
  norm,
  slugify,
  STORAGE_KEY,
  ADMIN_AUTH_KEY,
  LEGACY_KEYS,
  FALLBACK_IMG,
  FALLBACK_STORY_IMG,
  FALLBACK_EPAPER_IMG,
  type SiteData,
} from "@/lib/site-data";
import { getDb, FIREBASE_READY } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

// Re-export everything the rest of the app imports from "@/lib/store".
export type { SiteData, NewsArticle, WebStory, WebStorySlide, EPaperEdition, FooterLink, HomeWidget, SiteSettings, Poll, HomeConfig, FooterConfig } from "@/lib/site-data";
export type { Channel } from "@/lib/site-data";
export { buildDefaults, norm, slugify, STORAGE_KEY, ADMIN_AUTH_KEY, FALLBACK_IMG, FALLBACK_STORY_IMG, FALLBACK_EPAPER_IMG };
export { orderChannels, channelsBySlugList } from "@/lib/site-data";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
type StoreValue = {
  data: SiteData;
  /** Save locally AND push the whole document to the backend (live for visitors). */
  update: (fn: (draft: SiteData) => SiteData) => void;
  reset: () => void;
  /** null = checking, false = API unreachable / not configured, true = live backend */
  backendReady: boolean | null;
};

const SiteDataContext = createContext<StoreValue | null>(null);

async function apiGetSite(): Promise<SiteData | null> {
  try {
    const res = await fetch("/api/site", { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok: boolean; data?: SiteData };
    return json.ok && json.data ? json.data : null;
  } catch {
    return null;
  }
}

export function SiteDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SiteData>(() => buildDefaults());
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  // Hydrate after first paint: SSR renders defaults so the initial HTML always
  // matches. Then apply the localStorage cache, then pull from the API, then
  // attach the LIVE Firebase listener — admin saves reach visitors in realtime.
  useEffect(() => {
    let cancelled = false;
    let merged: SiteData | null = null;
    try {
      for (const k of LEGACY_KEYS) {
        try { localStorage.removeItem(k); } catch { /* */ }
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        merged = mergeStored(raw);
        // Detect stale v4 shape (stories without slug) → force fresh defaults
        const stale = (merged.stories as unknown as { slug?: string }[] | undefined)?.some((s) => !s.slug) && merged.stories.length > 0;
        if (stale) {
          try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
          merged = null;
        }
      }
    } catch {
      /* ignore */
    }
    if (merged) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration
      setData(merged);
    }

    // Initial pull from the backend (also confirms it's configured).
    void apiGetSite().then((remote) => {
      if (cancelled) return;
      setBackendReady(Boolean(remote));
      if (remote) {
        setData((prev) => {
          const next = mergeRemote(prev, remote);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* */ }
          return next;
        });
      }
    });

    if (FIREBASE_READY) {
      const db = getDb();
      if (db) {
        const siteRef = ref(db, "site");
        const unsub = onValue(
          siteRef,
          (snap) => {
            if (cancelled) return;
            const remote = (snap.val() as Partial<SiteData> | null) ?? null;
            if (!remote || !remote.news?.length) return; // empty node — server seeds it via GET /api/site
            setData((prev) => {
              const next = mergeRemote(prev, remote);
              try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* */ }
              return next;
            });
          },
          () => { /* permission/network error — stay on local data */ }
        );
        return () => {
          cancelled = true;
          unsub();
        };
      }
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((fn: (draft: SiteData) => SiteData) => {
    setData((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage full / unavailable — keep in-memory */
      }
      // Push the full document to the backend — live for every visitor.
      void (async () => {
        try {
          const res = await fetch("/api/site", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(next),
          });
          if (res.status === 401) {
            alert("Admin session expired — please log in again. Changes are saved on this device meanwhile.");
            setBackendReady(true);
          } else if (res.status === 503) {
            setBackendReady(false);
          } else if (!res.ok) {
            throw new Error(String(res.status));
          } else {
            setBackendReady(true);
          }
        } catch {
          alert("Backend sync failed — saved on this device only. Check internet / Firebase config.");
        }
      })();
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const fresh = buildDefaults();
    setData(fresh);
    void fetch("/api/site", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fresh),
    }).catch(() => { /* offline — local reset only */ });
  }, []);

  const value = useMemo(() => ({ data, update, reset, backendReady }), [data, update, reset, backendReady]);
  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData(): StoreValue {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error("useSiteData must be used inside <SiteDataProvider>");
  return ctx;
}
