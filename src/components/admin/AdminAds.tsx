"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useSiteData, type EPaperEdition } from "@/lib/store";
import { upsertSanityEdition, deleteSanityEdition, notifySync } from "@/lib/sanity-admin";
import { Card, Btn, TInput, ImageInput, EmptyState } from "./ui";

export function AdminAds() {
  const { data, update } = useSiteData();
  const { adSlots } = data.settings;

  const set = (key: keyof typeof adSlots, v: string) => update((d) => ({ ...d, settings: { ...d.settings, adSlots: { ...d.settings.adSlots, [key]: v } } }));

  const slots: { key: keyof typeof adSlots; label: string; hint: string }[] = [
    { key: "afterTitle", label: "Ad — After Article Title", hint: "Shown under the headline on article pages" },
    { key: "afterAuthor", label: "Ad — After Author Box", hint: "Shown below the date/author row" },
    { key: "inArticle", label: "Ad — Inside Article Body", hint: "Injected after the 2nd paragraph" },
    { key: "beforeShare", label: "Ad — Before Share Buttons", hint: "Reserved slot at the end of the article" },
  ];

  return (
    <Card title="Advertisement Slots" subtitle="These images appear inside news article pages. Leave empty to hide a slot.">
      <div className="space-y-4">
        {slots.map((s) => (
          <ImageInput key={s.key} label={s.label} value={adSlots[s.key]} onChange={(v) => set(s.key, v)} hint={s.hint} previewHeight={56} />
        ))}
      </div>
      <p className="mt-4 text-[11px] text-slate-400">
        Tip: empty slots show an “Advertise Here” placeholder box on article pages. Upload an image (or paste a URL) to replace it with the real ad. The homepage/sidebar boxes are decorative placeholders.
      </p>
    </Card>
  );
}

const emptyEdition = { name: "", date: "", cover: "", pdf: "" };

export function AdminEPaper() {
  const { data, update } = useSiteData();
  const { editions } = data;
  const [formOpen, setFormOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [form, setForm] = useState(emptyEdition);

  const openCreate = () => {
    setForm({ ...emptyEdition, date: new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) });
    setEditingName(null);
    setFormOpen(true);
  };

  const openEdit = (e: EPaperEdition) => {
    setForm({ name: e.name, date: e.date, cover: e.cover, pdf: e.pdf });
    setEditingName(e.name);
    setFormOpen(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.cover) return;
    const edition: EPaperEdition = { name: form.name.trim(), date: form.date.trim(), cover: form.cover, pdf: form.pdf.trim() || form.cover };
    if (editingName) {
      update((d) => ({ ...d, editions: d.editions.map((e) => (e.name === editingName ? edition : e)) }));
    } else {
      update((d) => ({ ...d, editions: [edition, ...d.editions] }));
    }
    notifySync(upsertSanityEdition(edition), "E-Paper");
    setFormOpen(false);
  };

  const remove = (name: string) => {
    if (!confirm(`Delete edition "${name}"?`)) return;
    update((d) => ({ ...d, editions: d.editions.filter((e) => e.name !== name) }));
    notifySync(deleteSanityEdition(name), "E-Paper delete");
  };

  if (formOpen) {
    return (
      <Card
        title={editingName ? "Edit Edition" : "Add Edition"}
        actions={
          <Btn variant="ghost" small onClick={() => setFormOpen(false)}>
            <ArrowLeft size={13} /> Back
          </Btn>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TInput label="Edition Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. HFH" />
          <TInput label="Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <div className="md:col-span-2">
            <ImageInput label="Cover Image *" value={form.cover} onChange={(v) => setForm({ ...form, cover: v })} previewHeight={140} />
          </div>
          <div className="md:col-span-2">
            <TInput label="PDF Link" value={form.pdf} onChange={(v) => setForm({ ...form, pdf: v })} placeholder="/uploads/pdfs/edition.pdf or https://…" />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Btn onClick={save} disabled={!form.name.trim() || !form.cover}>
            {editingName ? "Save Changes" : "Publish Edition"}
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
      title={`E-Paper Editions (${editions.length})`}
      subtitle="Editions shown on the E-Newspaper page and in the sidebar widget."
      actions={
        <Btn onClick={openCreate}>
          <Plus size={14} /> Add Edition
        </Btn>
      }
    >
      {editions.length === 0 ? (
        <EmptyState text="No editions yet — click Add Edition." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {editions.map((e) => (
            <div key={e.name} className="rounded-xl border border-slate-200 p-2.5">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-slate-100">
                {e.cover ? <img src={e.cover} alt={e.name} className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
              </div>
              <div className="mt-2 truncate text-[12px] font-bold text-slate-700">{e.name}</div>
              <div className="text-[11px] text-slate-400">{e.date}</div>
              <div className="mt-2 flex gap-1.5">
                <Btn variant="secondary" small onClick={() => openEdit(e)}>
                  <Pencil size={11} /> Edit
                </Btn>
                <Btn variant="danger" small onClick={() => remove(e.name)}>
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
