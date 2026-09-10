"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, ArrowLeft, List } from "lucide-react";
import { useSiteData, slugify, norm, type Channel } from "@/lib/store";
import { Card, Btn, TInput, ImageInput, EmptyState } from "./ui";

export default function AdminChannels() {
  const { data, update } = useSiteData();
  const channels = data.channels.filter((c) => c.slug !== "0");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", description: "" });

  const openCreate = () => {
    setForm({ name: "", slug: "", icon: "", description: "" });
    setEditingSlug(null);
    setFormOpen(true);
  };

  const openEdit = (c: Channel) => {
    setForm({ name: c.name, slug: c.slug, icon: c.icon ?? "", description: c.description ?? "" });
    setEditingSlug(c.slug);
    setFormOpen(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    const slug = slugify(form.slug.trim());
    const channel: Channel = { slug, name: form.name.trim(), icon: norm(form.icon), description: form.description.trim() || "Your Trusted News Source" };
    if (editingSlug) {
      update((d) => {
        const news = d.news.map((n) => (n.channel === editingSlug ? { ...n, channel: slug, channelName: channel.name } : n));
        return { ...d, news, channels: d.channels.map((c) => (c.slug === editingSlug ? channel : c)) };
      });
    } else {
      update((d) => ({ ...d, channels: [...d.channels.filter((c) => c.slug !== "0"), channel, d.channels.find((c) => c.slug === "0")].filter(Boolean) as Channel[] }));
    }
    setFormOpen(false);
  };

  const remove = (slug: string) => {
    const count = data.news.filter((n) => n.channel === slug).length;
    if (!confirm(`Delete channel "${slug}"?${count ? ` ${count} articles will lose their channel.` : ""}`)) return;
    update((d) => ({
      ...d,
      channels: d.channels.filter((c) => c.slug !== slug),
      news: d.news.map((n) => (n.channel === slug ? { ...n, channel: null, channelName: null } : n)),
      home: { ...d.home, widgets: d.home.widgets.filter((w) => w.slug !== slug) },
      footer: { ...d.footer, categorySlugs: d.footer.categorySlugs.filter((s) => s !== slug) },
    }));
  };

  if (formOpen) {
    return (
      <Card
        title={editingSlug ? "Edit Channel" : "Add Channel"}
        actions={
          <Btn variant="ghost" small onClick={() => setFormOpen(false)}>
            <ArrowLeft size={13} /> Back
          </Btn>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TInput label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v, slug: editingSlug ? form.slug : slugify(v) })} />
          <TInput label="Slug (URL)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} hint="channel/{slug}" />
          <div className="md:col-span-2">
            <ImageInput label="Icon" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} previewHeight={48} preset="icon" folder="icons" hint="Small square icon shown in the nav (optional)" />
          </div>
          <div className="md:col-span-2">
            <TInput label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Your Trusted News Source" />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Btn onClick={save} disabled={!form.name.trim() || !form.slug.trim()}>
            {editingSlug ? "Save Changes" : "Create Channel"}
          </Btn>
          <Btn variant="secondary" onClick={() => setFormOpen(false)}>
            Cancel
          </Btn>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={`Channels (${channels.length})`}
      subtitle="Channels appear in the navigation, footer and homepage widgets."
      actions={
        <Btn onClick={openCreate}>
          <Plus size={14} /> Add Channel
        </Btn>
      }
    >
      {channels.length === 0 ? (
        <EmptyState text="No channels yet — click Add Channel." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {channels.map((c) => (
            <div key={c.slug} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-orange-300">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                {c.icon ? <img src={c.icon} alt="" className="h-7 w-7 object-contain" /> : <List size={18} className="text-orange-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-slate-800">{c.name}</div>
                <div className="truncate text-[11px] text-slate-400">/{c.slug}</div>
              </div>
              <div className="flex flex-col gap-1">
                <Btn variant="secondary" small onClick={() => openEdit(c)}>
                  <Pencil size={11} /> Edit
                </Btn>
                <Btn variant="danger" small onClick={() => remove(c.slug)}>
                  <Trash2 size={11} /> Del
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
