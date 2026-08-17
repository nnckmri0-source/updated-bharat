"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useSiteData } from "@/lib/store";
import { Card, Btn, TInput, TSelect, EmptyState } from "./ui";

export default function AdminHome() {
  const { data, update } = useSiteData();
  const { news, channels, home } = data;
  const [newWidgetSlug, setNewWidgetSlug] = useState("");

  const articleOptions = news.map((n) => ({ value: n.slug, label: n.title }));
  const channelOptions = channels.filter((c) => c.slug !== "0").map((c) => ({ value: c.slug, label: c.name }));

  const setHeroMain = (slug: string) => update((d) => ({ ...d, home: { ...d.home, heroMain: slug } }));

  const toggleSub = (slug: string) =>
    update((d) => {
      const cur = d.home.subFeatured;
      const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : cur.length >= 3 ? cur : [...cur, slug];
      return { ...d, home: { ...d.home, subFeatured: next } };
    });

  const toggleGrid = (slug: string) =>
    update((d) => {
      const cur = d.home.latestGrid;
      const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : cur.length >= 6 ? cur : [...cur, slug];
      return { ...d, home: { ...d.home, latestGrid: next } };
    });

  const moveWidget = (i: number, dir: -1 | 1) =>
    update((d) => {
      const w = [...d.home.widgets];
      const j = i + dir;
      if (j < 0 || j >= w.length) return d;
      [w[i], w[j]] = [w[j], w[i]];
      return { ...d, home: { ...d.home, widgets: w } };
    });

  const removeWidget = (slug: string) => update((d) => ({ ...d, home: { ...d.home, widgets: d.home.widgets.filter((w) => w.slug !== slug) } }));

  const addWidget = () => {
    if (!newWidgetSlug) return;
    update((d) => ({
      ...d,
      home: { ...d.home, widgets: [...d.home.widgets, { slug: newWidgetSlug, color: "#f47216" }] },
    }));
    setNewWidgetSlug("");
  };

  const setWidgetColor = (slug: string, color: string) =>
    update((d) => ({ ...d, home: { ...d.home, widgets: d.home.widgets.map((w) => (w.slug === slug ? { ...w, color } : w)) } }));

  const setWidgetStyle = (slug: string, style: "list" | "magazine" | "video") =>
    update((d) => ({ ...d, home: { ...d.home, widgets: d.home.widgets.map((w) => (w.slug === slug ? { ...w, style } : w)) } }));

  return (
    <div className="space-y-4">
      {/* Hero */}
      <Card title="Hero (Big Featured Story)" subtitle="The large image at the very top of the homepage.">
        <TSelect label="Main Hero Article" value={home.heroMain} onChange={setHeroMain} options={articleOptions} />
      </Card>

      {/* Sub featured */}
      <Card title="Sub-Featured Stories (pick up to 3)" subtitle="The three small links below the hero image.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {news.slice(0, 12).map((n) => {
            const checked = home.subFeatured.includes(n.slug);
            return (
              <label key={n.slug} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition ${checked ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleSub(n.slug)} className="accent-orange-500" />
                <span className="truncate">{n.title}</span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Only the first 12 articles are listed; order shown = homepage order.</p>
      </Card>

      {/* Latest grid */}
      <Card title="Latest News Grid (pick up to 6)" subtitle="The 2-column grid under “Latest News”.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {news.slice(0, 12).map((n) => {
            const checked = home.latestGrid.includes(n.slug);
            return (
              <label key={n.slug} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition ${checked ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleGrid(n.slug)} className="accent-orange-500" />
                <span className="truncate">{n.title}</span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Channel widgets */}
      <Card title="Homepage Channel Widgets" subtitle="Sections shown down the homepage, in this order. Each shows that channel’s latest 4 articles.">
        {home.widgets.length === 0 ? (
          <EmptyState text="No widgets — add channels below." />
        ) : (
          <div className="space-y-2">
            {home.widgets.map((w, i) => (
              <div key={`${w.slug}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <div className="h-9 w-1.5 rounded-full" style={{ background: w.color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-slate-800">{channels.find((c) => c.slug === w.slug)?.name ?? w.slug}</div>
                  <div className="text-[11px] text-slate-400">/{w.slug}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={w.color} onChange={(e) => setWidgetColor(w.slug, e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5" title="Accent color" />
                  <select
                    value={w.style ?? "list"}
                    onChange={(e) => setWidgetStyle(w.slug, e.target.value as "list" | "magazine" | "video")}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12px] text-slate-700 focus:border-orange-400 focus:outline-none"
                    title="Widget layout style"
                  >
                    <option value="list">List</option>
                    <option value="magazine">Magazine</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <Btn variant="secondary" small onClick={() => moveWidget(i, -1)} disabled={i === 0}>
                  <ArrowUp size={13} />
                </Btn>
                <Btn variant="secondary" small onClick={() => moveWidget(i, 1)} disabled={i === home.widgets.length - 1}>
                  <ArrowDown size={13} />
                </Btn>
                <Btn variant="danger" small onClick={() => removeWidget(w.slug)}>
                  <Trash2 size={13} />
                </Btn>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <div className="w-64">
            <TSelect value={newWidgetSlug} onChange={setNewWidgetSlug} options={[{ value: "", label: "Choose a channel…" }, ...channelOptions]} />
          </div>
          <Btn onClick={addWidget} disabled={!newWidgetSlug}>
            <Plus size={14} /> Add Widget
          </Btn>
        </div>
      </Card>
    </div>
  );
}
