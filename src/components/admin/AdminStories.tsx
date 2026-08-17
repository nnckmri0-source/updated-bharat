"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useSiteData, norm, type WebStory } from "@/lib/store";
import { upsertSanityStory, deleteSanityStory } from "@/lib/sanity-admin";
import { Card, Btn, TInput, ImageInput, EmptyState } from "./ui";

export default function AdminStories() {
  const { data, update } = useSiteData();
  const { stories } = data;
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", url: "", image: "" });

  const openCreate = () => {
    setForm({ title: "", url: "/web-stories", image: "" });
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (s: WebStory) => {
    setForm({ title: s.title, url: s.url, image: s.image ?? "" });
    setEditingId(s.id ?? null);
    setFormOpen(true);
  };

  const save = () => {
    const id = editingId ?? `story-${Date.now()}`;
    const story: WebStory = {
      id,
      title: form.title.trim() || "Web Story",
      url: form.url.trim() || "/web-stories",
      image: norm(form.image),
    };
    if (editingId) {
      update((d) => ({ ...d, stories: d.stories.map((s) => (s.id === editingId ? story : s)) }));
    } else {
      update((d) => ({ ...d, stories: [...d.stories, story] }));
    }
    void upsertSanityStory(story);
    setFormOpen(false);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this web story?")) return;
    update((d) => ({ ...d, stories: d.stories.filter((s) => s.id !== id) }));
    void deleteSanityStory(id);
  };

  if (formOpen) {
    return (
      <Card
        title={editingId ? "Edit Web Story" : "Add Web Story"}
        actions={
          <Btn variant="ghost" small onClick={() => setFormOpen(false)}>
            <ArrowLeft size={13} /> Back
          </Btn>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TInput label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Story title shown under the image" />
          <TInput label="Link" value={form.url} onChange={(v) => setForm({ ...form, url: v })} hint="Where tapping the story goes (e.g. /web-stories)" />
          <div className="md:col-span-2">
            <ImageInput label="Story Image (4:5)" value={form.image} onChange={(v) => setForm({ ...form, image: v })} previewHeight={110} />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Btn onClick={save} disabled={!form.image}>
            {editingId ? "Save Changes" : "Add Story"}
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
      title={`Web Stories (${stories.length})`}
      subtitle="Stories appear in the Web Stories row on the homepage."
      actions={
        <Btn onClick={openCreate}>
          <Plus size={14} /> Add Story
        </Btn>
      }
    >
      {stories.length === 0 ? (
        <EmptyState text="No web stories yet — click Add Story." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stories.map((s) => (
            <div key={s.id ?? s.title} className="rounded-xl border border-slate-200 p-2.5">
              <div className="aspect-[4/5] overflow-hidden rounded-lg bg-slate-100">
                {s.image ? <img src={s.image} alt={s.title} className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
              </div>
              <div className="mt-2 truncate text-[12px] font-semibold text-slate-700">{s.title}</div>
              <div className="mt-2 flex gap-1.5">
                <Btn variant="secondary" small onClick={() => openEdit(s)}>
                  <Pencil size={11} /> Edit
                </Btn>
                <Btn variant="danger" small onClick={() => remove(s.id ?? s.title)}>
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
