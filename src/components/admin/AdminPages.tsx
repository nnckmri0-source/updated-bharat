"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useSiteData, slugify, type SitePage } from "@/lib/store";
import { Card, Btn, TInput, EmptyState } from "./ui";
import RichTextEditor from "./RichTextEditor";

const emptyForm = { title: "", slug: "", content: "" };

export default function AdminPages() {
  const { data, update } = useSiteData();
  const { pages } = data;
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (p: SitePage) => {
    setForm({ title: p.title, slug: p.slug, content: p.content });
    setEditingId(p.id);
    setFormOpen(true);
  };

  const save = () => {
    if (!form.title.trim() || !form.slug.trim()) return;
    const slug = slugify(form.slug.trim());
    const id = editingId ?? slug;
    const page: SitePage = {
      id,
      title: form.title.trim(),
      slug,
      content: form.content.trim() || `<h2>${form.title.trim()}</h2><p>Coming soon.</p>`,
      updatedAt: new Date().toISOString(),
    };
    update((d) => ({
      ...d,
      pages: editingId ? d.pages.map((p) => (p.id === editingId ? page : p)) : [...d.pages, page],
    }));
    setFormOpen(false);
  };

  const remove = (id: string) => {
    if (!confirm("Delete this page permanently? Footer links pointing to it will break.")) return;
    update((d) => ({ ...d, pages: d.pages.filter((p) => p.id !== id) }));
  };

  if (formOpen) {
    return (
      <Card
        title={editingId ? "Edit Page" : "Add Page"}
        actions={
          <Btn variant="ghost" small onClick={() => setFormOpen(false)}>
            <ArrowLeft size={13} /> Back
          </Btn>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TInput label="Title *" value={form.title} onChange={(v) => setForm({ ...form, title: v, slug: editingId ? form.slug : slugify(v) })} placeholder="e.g. Contact Us" />
          <TInput label="Slug (URL)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} hint="/page/{slug} — footer links point here" />
          <div className="md:col-span-2">
            <label className="block text-[13px] font-semibold text-slate-700 mb-1">Content — H1/H2/Bold/Italic + Images</label>
            <RichTextEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} placeholder="Write page content here…" />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Btn onClick={save} disabled={!form.title.trim() || !form.slug.trim()}>
            {editingId ? "Save Changes" : "Publish Page"}
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
      title={`Content Pages (${pages.length})`}
      subtitle="Privacy Policy, Contact Us… — linked from the footer, opens at /page/{slug}."
      actions={
        <Btn onClick={openCreate}>
          <Plus size={14} /> Add Page
        </Btn>
      }
    >
      {pages.length === 0 ? (
        <EmptyState text="No pages yet — click Add Page." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-semibold">Page</th>
                <th className="py-2 pr-3 font-semibold">URL</th>
                <th className="py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-orange-50/40">
                  <td className="py-2.5 pr-3 font-semibold text-slate-800">{p.title}</td>
                  <td className="py-2.5 pr-3">
                    <a href={`/page/${p.slug}`} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">/page/{p.slug}</a>
                  </td>
                  <td className="py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Btn variant="secondary" small onClick={() => openEdit(p)}>
                        <Pencil size={12} /> Edit
                      </Btn>
                      <Btn variant="danger" small onClick={() => remove(p.id)}>
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
