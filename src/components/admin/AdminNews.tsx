"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, ArrowLeft, Filter } from "lucide-react";
import { useSiteData, slugify, norm, type NewsArticle } from "@/lib/store";
import { upsertSanityArticle, deleteSanityArticle } from "@/lib/sanity-admin";
import { Card, Btn, TInput, TArea, TSelect, ImageInput, EmptyState } from "./ui";

const emptyForm = { title: "", slug: "", channel: "", date: "", image: "", content: "" };

export default function AdminNews() {
  const { data, update } = useSiteData();
  const { news, channels } = data;
  const [filter, setFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = filter ? news.filter((n) => n.channel === filter) : news;

  const openCreate = () => {
    setForm({ ...emptyForm, date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) });
    setEditingSlug(null);
    setFormOpen(true);
  };

  const openEdit = (a: NewsArticle) => {
    setForm({ title: a.title, slug: a.slug, channel: a.channel ?? "", date: a.date, image: a.image ?? "", content: a.content });
    setEditingSlug(a.slug);
    setFormOpen(true);
  };

  const save = () => {
    if (!form.title.trim() || !form.slug.trim()) return;
    const slug = slugify(form.slug.trim());
    const channel = channels.find((c) => c.slug === form.channel) ?? null;
    const article: NewsArticle = {
      slug,
      title: form.title.trim(),
      channel: channel?.slug ?? null,
      channelName: channel?.name ?? null,
      date: form.date.trim() || "Today",
      content: form.content.trim() || form.title.trim(),
      image: norm(form.image),
    };

    if (editingSlug) {
      update((d) => ({ ...d, news: d.news.map((n) => (n.slug === editingSlug ? article : n)) }));
    } else {
      update((d) => ({ ...d, news: [article, ...d.news] }));
    }
    // push to Sanity too (no-op without a token configured)
    void upsertSanityArticle(article, article.channel);
    setFormOpen(false);
  };

  const remove = (slug: string) => {
    if (!confirm(`Delete "${slug}" permanently?`)) return;
    update((d) => ({ ...d, news: d.news.filter((n) => n.slug !== slug) }));
    void deleteSanityArticle(slug);
  };

  const channelOptions = [{ value: "", label: "— No channel —" }, ...channels.filter((c) => c.slug !== "0").map((c) => ({ value: c.slug, label: c.name }))];

  if (formOpen) {
    return (
      <Card
        title={editingSlug ? "Edit News Article" : "Add News Article"}
        actions={
          <Btn variant="ghost" small onClick={() => setFormOpen(false)}>
            <ArrowLeft size={13} /> Back
          </Btn>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TInput label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v, slug: editingSlug ? form.slug : slugify(v) })} />
          <TInput label="Slug (URL)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} hint="news/{slug} — auto-generated from title" />
          <TSelect label="Channel" value={form.channel} onChange={(v) => setForm({ ...form, channel: v })} options={channelOptions} />
          <TInput label="Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} placeholder="Apr 23, 2026" />
          <div className="md:col-span-2">
            <ImageInput label="Cover Image" value={form.image} onChange={(v) => setForm({ ...form, image: v })} previewHeight={90} />
          </div>
          <div className="md:col-span-2">
            <TArea
              label="Content (paragraphs separated by blank line)"
              value={form.content}
              onChange={(v) => setForm({ ...form, content: v })}
              rows={10}
              hint="Paste a YouTube link on its own line to embed a video. Start a line with IMG:https://… to insert an image between paragraphs."
            />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Btn onClick={save} disabled={!form.title.trim() || !form.slug.trim()}>
            {editingSlug ? "Save Changes" : "Publish Article"}
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
      title={`News Articles (${filtered.length}${filter ? ` / ${news.length}` : ""})`}
      subtitle="Add, edit or delete stories — changes appear on the site instantly."
      actions={
        <Btn onClick={openCreate}>
          <Plus size={14} /> Add News
        </Btn>
      }
    >
      {/* Channel filter */}
      <div className="mb-4 flex items-center gap-2">
        <Filter size={14} className="text-slate-400" />
        <div className="w-64">
          <TSelect
            value={filter}
            onChange={setFilter}
            options={[
              { value: "", label: `All channels (${news.length})` },
              ...channels
                .filter((c) => c.slug !== "0")
                .map((c) => ({ value: c.slug, label: `${c.name} (${news.filter((n) => n.channel === c.slug).length})` })),
            ]}
          />
        </div>
        {filter && (
          <Btn variant="ghost" small onClick={() => setFilter("")}>
            Clear
          </Btn>
        )}
      </div>
      {filtered.length === 0 ? (
        <EmptyState text={filter ? "No articles in this channel yet — click Add News." : "No articles yet — click Add News to publish your first story."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-semibold">Article</th>
                <th className="py-2 pr-3 font-semibold">Channel</th>
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.slug} className="border-b border-slate-50 hover:bg-orange-50/40">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-3">
                      {n.image ? (
                        <img src={n.image} alt="" className="h-10 w-14 rounded-md object-cover" />
                      ) : (
                        <div className="h-10 w-14 rounded-md bg-orange-100 flex items-center justify-center text-lg">📰</div>
                      )}
                      <div className="min-w-0">
                        <div className="max-w-[340px] truncate font-semibold text-slate-800">{n.title}</div>
                        <div className="text-[11px] text-slate-400">/{n.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-500">{n.channelName ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-slate-500">{n.date}</td>
                  <td className="py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Btn variant="secondary" small onClick={() => openEdit(n)}>
                        <Pencil size={12} /> Edit
                      </Btn>
                      <Btn variant="danger" small onClick={() => remove(n.slug)}>
                        <Trash2 size={12} /> Delete
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
