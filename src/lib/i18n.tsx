"use client";

// ============================================================================
// LIGHT I18N — Hindi / English
// ---------------------------------------------------------------
// Switches the UI chrome (nav labels, section titles, buttons) between Hindi
// and English. Content (articles) stays as authored; when real bilingual
// content arrives via Firebase, extend this dictionary + article fields.
// Choice is persisted in localStorage ("ub_lang").
// ============================================================================

import { useSyncExternalStore } from "react";

export type Lang = "hi" | "en";

const STORE_KEY = "ub_lang";

let lang: Lang = "en";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setLang(next: Lang) {
  if (next === lang) return;
  lang = next;
  try {
    localStorage.setItem(STORE_KEY, next);
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Lang {
  return lang;
}

export function useLang(): Lang {
  // English-only site — kept so components subscribe/re-render on language state.
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const dict: Record<string, Record<string, string>> = {
  en: {
    home: "Home",
    stories: "Stories",
    search: "Search",
    epaper: "E-Paper",
    menu: "Menu",
    breaking: "Breaking",
    topNews: "Top News",
    webStories: "Web Stories",
    trending: "Trending",
    followUs: "Follow us on",
    searchPh: "Search news...",
    searchPhMobile: "Search news, topics, city or state",
    latestNews: "Latest News",
    seeAll: "See All",
    more: "More",
    quickLinks: "Quick Links",
    categories: "Categories",
    newsletter: "Newsletter",
    adminPanel: "Admin Panel",
    rightsReserved: "All rights reserved.",
    trendingNow: "Trending Now",
    readEdition: "Read Edition",
    saved: "Saved",
    notifications: "Notifications",
    breakingAlerts: "Breaking Alerts",
    latestUpdates: "Latest Updates",
    markAllRead: "Mark all read",
    noAlerts: "No new alerts right now",
    advertiseHere: "Advertise Here",
    adPlaceholder: "Your ad could be here",
    relatedStories: "Related Stories",
    shareArticle: "Share this article",
    articleNotFound: "Article not found",
    backHome: "Back to Home",
    searchResults: "Search Results",
    bookmarks: "Bookmarks",
    noResults: "No results found",
    channelNotFound: "Channel not found",
    topicChannel: "Topic Channel",
    noStoriesInChannel: "No stories in this channel yet. Check back soon!",
  },
};

export function t(key: string): string {
  const d = dict[lang] ?? dict.en;
  return d[key] ?? dict.en[key] ?? key;
}
