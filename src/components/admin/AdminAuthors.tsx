"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useSiteData, slugify, norm, type Author } from "@/lib/store";
import { Card, Btn, TInput, ImageInput, EmptyState } from "./ui";

const emptyForm = { name: "", image: "" };

export default function AdminAuthors() {
  const { data, update } = useSiteData();
  const { authors, news } = data;
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (a: Author) => {
    setForm({ name: a.name, image: a.image ?? "" });
    setEditingId(a.id);
    setFormOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const id = editingId ?? slugify(form.name.trim());
    const author: Author = { id, name: form.name.trim(), image: norm(form.image) };
    update((d) => ({
      ...d,
      authors: editingId
        ? d.authors.map((a) => (a.id === editingId ? author : a))
        : [...d.authors, author],
    }));
    setFormOpen(false);
  };

  const remove = (id: string) => {
    const count = news.filter((n) => n.authorId === id).length;
    if (!confirm(`Delete this author permanently?${count ? ` ${count} article(s) will fall back to the site name.` : ""}`)) return;
    update((d) => ({
      ...d,
      authors: d.authors.filter((a) => a.id !== id),
      news: d.news.map((n) => (n.authorId === id ? { ...n, authorId: null } : n)),
    }));
  };

  if (formOpen) {
    return (
      <Card
        title={editingId ? "Edit Author" : "Add Author"}
        actions={
          <Btn variant="ghost" small onClick={() => setFormOpen(false)}>
            <ArrowLeft size={13} /> Back
          </Btn>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TInput label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Suresh Baskey" />
          <div className="md:col-span-2">
            <ImageInput label="Photo / Icon (optional — initial letter shows when empty)" value={form.image} onChange={(v) => setForm({ ...form, image: v })} previewHeight={64} preset="icon" folder="authors" />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Btn onClick={save} disabled={!form.name.trim()}>
            {editingId ? "Save Changes" : "Add Author"}
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
      title={`Authors (${authors.length})`}
      subtitle="Pick an author while publishing — photo + name appear on the article page."
      actions={
        <Btn onClick={openCreate}>
          <Plus size={14} /> Add Author
        </Btn>
      }
    >
      {authors.length === 0 ? (
        <EmptyState text="No authors yet — click Add Author." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-semibold">Author</th>
                <th className="py-2 pr-3 font-semibold">Articles</th>
                <th className="py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-orange-50/40">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-3">
                      {a.image ? (
                        <img src={a.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-extrabold text-lg">
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800">{a.name}</div>
                        <div className="text-[11px] text-slate-400">/{a.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-500">{news.filter((n) => n.authorId === a.id).length}</td>
                  <td className="py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Btn variant="secondary" small onClick={() => openEdit(a)}>
                        <Pencil size={12} /> Edit
                      </Btn>
                      <Btn variant="danger" small onClick={() => remove(a.id)}>
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
