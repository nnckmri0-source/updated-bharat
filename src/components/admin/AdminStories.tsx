"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, ArrowLeft, Image as ImgIcon } from "lucide-react";
import { useSiteData, norm, slugify, type WebStory, type WebStorySlide } from "@/lib/store";
import { Card, Btn, TInput, TArea, ImageInput, EmptyState } from "./ui";

export default function AdminStories() {
  const { data, update } = useSiteData();
  const { stories } = data;
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", category: "", description: "", image: "", slides: [] as WebStorySlide[] });

  const openCreate = () => {
    setForm({ title: "", slug: "", category: "Technology", description: "", image: "", slides: [] });
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (s: WebStory) => {
    setForm({ title: s.title, slug: s.slug ?? "", category: s.category ?? "", description: s.description ?? "", image: s.image ?? "", slides: s.slides ? [...s.slides] : [] });
    setEditingId(s.id ?? null);
    setFormOpen(true);
  };

  const addSlide = () => setForm((f) => ({ ...f, slides: [...f.slides, { image: "", title: "", caption: "", alt: "" }] }));
  const updateSlide = (idx: number, patch: Partial<WebStorySlide>) => setForm((f) => ({ ...f, slides: f.slides.map((s, i) => (i === idx ? { ...s, ...patch } : s)) }));
  const removeSlide = (idx: number) => setForm((f) => ({ ...f, slides: f.slides.filter((_, i) => i !== idx) }));

  const save = () => {
    const id = editingId ?? `story-${Date.now()}`;
    const slug = slugify(form.slug.trim() || form.title.trim()) || `story-${Date.now()}`;
    const slides = form.slides.filter((sl) => sl.image).map((sl) => ({ ...sl, image: norm(sl.image) }));
    const story: WebStory = {
      id,
      slug,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      title: form.title.trim() || "Web Story",
      url: `/visualstories/${slug}`,
      image: norm(form.image),
      slides: slides.length ? slides : undefined,
    };
    if (editingId) {
      update((d) => ({ ...d, stories: d.stories.map((s) => (s.id === editingId ? story : s)) }));
    } else {
      update((d) => ({ ...d, stories: [...d.stories, story] }));
    }
    setFormOpen(false);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this web story?")) return;
    update((d) => ({ ...d, stories: d.stories.filter((s) => s.id !== id) }));
  };

  if (formOpen) {
    return (
      <Card
        title={editingId ? "Edit Visual Story" : "Add Visual Story (IndiaToday style)"}
        actions={
          <Btn variant="ghost" small onClick={() => setFormOpen(false)}>
            <ArrowLeft size={13} /> Back
          </Btn>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TInput label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v, slug: form.slug || slugify(v) })} placeholder="e.g. iPhone 17e is available under Rs 58,400" />
          <TInput label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} hint="/visualstories/{slug} — auto from title" />
          <TInput label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="Technology" />
          <div className="md:col-span-2">
            <ImageInput label="Cover Image (9:16)" value={form.image} onChange={(v) => setForm({ ...form, image: v })} previewHeight={140} preset="story" folder="stories" hint="Shown in homepage row & grid — 9:16 vertical" />
          </div>
          <div className="md:col-span-2">
            <TArea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={2} placeholder="One-line description shown under title in grid" />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-800">Slides — IndiaToday-style vertical stories ({form.slides.length})</h4>
            <Btn small onClick={addSlide}><ImgIcon size={13} /> Add Slide</Btn>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">Each slide = full-screen page. Add 3-10 slides. First slide uses cover if slides empty.</p>
          {form.slides.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">No slides yet — story will show cover only. Add slides for IndiaToday viewer.</p> : (
            <div className="space-y-3">
              {form.slides.map((sl, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 p-3 flex gap-3">
                  <div className="w-24 shrink-0">
                    <ImageInput label={`Slide ${idx + 1} Image`} value={sl.image ?? ""} onChange={(v) => updateSlide(idx, { image: v })} previewHeight={80} preset="story" folder="stories" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 gap-2">
                    <TInput value={sl.title ?? ""} onChange={(v) => updateSlide(idx, { title: v })} placeholder="Slide title" />
                    <TArea value={sl.caption ?? ""} onChange={(v) => updateSlide(idx, { caption: v })} rows={2} placeholder="Caption / description" />
                    <div className="flex gap-2">
                      <TInput value={sl.alt ?? ""} onChange={(v) => updateSlide(idx, { alt: v })} placeholder="Alt text" />
                      <Btn variant="danger" small onClick={() => removeSlide(idx)}>Remove</Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <Btn onClick={save} disabled={!form.image || !form.title.trim()}>
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
