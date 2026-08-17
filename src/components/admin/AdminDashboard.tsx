"use client";

import Link from "next/link";
import { Newspaper, FolderOpen, Images, BookOpen, Database, ExternalLink } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { Card, Btn } from "./ui";

export default function AdminDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data, reset } = useSiteData();
  const stats = [
    { label: "News Articles", value: data.news.length, icon: Newspaper, tab: "news", color: "bg-orange-100 text-orange-600" },
    { label: "Channels", value: data.channels.filter((c) => c.slug !== "0").length, icon: FolderOpen, tab: "channels", color: "bg-blue-100 text-blue-600" },
    { label: "Web Stories", value: data.stories.length, icon: Images, tab: "stories", color: "bg-purple-100 text-purple-600" },
    { label: "E-Paper Editions", value: data.editions.length, icon: BookOpen, tab: "epaper", color: "bg-green-100 text-green-600" },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onNavigate(s.tab)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-orange-300 hover:shadow"
          >
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div className="text-2xl font-extrabold text-slate-800">{s.value}</div>
            <div className="text-[12px] font-medium text-slate-400">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Quick actions */}
      <Card title="Quick Actions" subtitle="Manage everything that appears on the frontend.">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          <Btn onClick={() => onNavigate("news")}>✍️ Write / Edit News</Btn>
          <Btn onClick={() => onNavigate("channels")} variant="secondary">🗂️ Manage Channels</Btn>
          <Btn onClick={() => onNavigate("stories")} variant="secondary">🖼️ Web Stories</Btn>
          <Btn onClick={() => onNavigate("home")} variant="secondary">🏠 Homepage Layout</Btn>
          <Btn onClick={() => onNavigate("ticker")} variant="secondary">📰 Ticker & Trending</Btn>
          <Btn onClick={() => onNavigate("ads")} variant="secondary">📢 Ad Slots</Btn>
          <Btn onClick={() => onNavigate("polls")} variant="secondary">📊 Polls</Btn>
          <Btn onClick={() => onNavigate("epaper")} variant="secondary">🗞️ E-Paper</Btn>
          <Btn onClick={() => onNavigate("settings")} variant="secondary">⚙️ Site Settings (Ads + Push)</Btn>
          <Btn onClick={() => onNavigate("footer")} variant="secondary">🔗 Footer</Btn>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3">
          <Database size={16} className="text-slate-400" />
          <div className="flex-1 text-[12px] text-slate-500">
            <strong>How it works:</strong> all changes are saved in this browser (localStorage). When you connect Firebase later, the same store
            will sync to your database — the site frontend doesn’t need to change.
          </div>
          <Btn
            variant="danger"
            small
            onClick={() => {
              if (confirm("Reset ALL site content back to the original defaults? This cannot be undone.")) reset();
            }}
          >
            Reset All Data
          </Btn>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg bg-navy px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
          >
            View Website <ExternalLink size={12} />
          </Link>
        </div>
      </Card>
    </div>
  );
}
