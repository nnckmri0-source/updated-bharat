"use client";

// Injects admin-configured third-party snippets (AdSense header script +
// OneSignal push notifications) into the page. Reads from the same store as
// the rest of the site, so whatever the admin saves in Settings goes live.

import { useEffect } from "react";
import { useSiteData } from "@/lib/store";

export default function SiteHeadInject() {
  const { data } = useSiteData();
  const { settings } = data;

  useEffect(() => {
    const onImgErr = (e: Event) => {
      const img = e.target as HTMLImageElement;
      if (img.tagName === "IMG" && !img.dataset.fallback) {
        img.dataset.fallback = "1";
        img.src = "https://placehold.co/800x500/f47216/ffffff?text=Updated+Bharat";
      }
    };
    document.addEventListener("error", onImgErr, true);
    return () => document.removeEventListener("error", onImgErr, true);
  }, []);

  useEffect(() => {
    // 1) Google AdSense — header script (auto ads)
    if (settings.adsenseHeaderCode && !document.getElementById("ub-adsense-header")) {
      const holder = document.createElement("div");
      holder.id = "ub-adsense-header";
      holder.innerHTML = settings.adsenseHeaderCode;
      holder.querySelectorAll("script").forEach((old) => {
        const s = document.createElement("script");
        [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
        s.textContent = old.textContent ?? "";
        old.replaceWith(s);
      });
      document.head.appendChild(holder);
    }

    // 2) OneSignal — web push
    if (settings.onesignalAppId && !window.OneSignal) {
      const s = document.createElement("script");
      s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      s.defer = true;
      s.onload = () => {
        const os = window.OneSignal as OneSignalSDK | undefined;
        os?.push(() => {
          os?.init?.({
            appId: settings.onesignalAppId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: false },
          });
        });
      };
      document.head.appendChild(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.adsenseHeaderCode, settings.onesignalAppId]);

  return null;
}

type OneSignalSDK = unknown[] & {
  push: (fn: () => void) => void;
  init?: (opts: { appId: string; allowLocalhostAsSecureOrigin?: boolean; notifyButton?: { enable?: boolean } }) => void;
};

declare global {
  interface Window {
    OneSignal?: OneSignalSDK;
  }
}
