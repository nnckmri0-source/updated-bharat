"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useSiteData, type Poll } from "@/lib/store";
import { upsertSanityPoll, deleteSanityPoll } from "@/lib/sanity-admin";
import { Card, Btn, TInput, TArea, EmptyState } from "./ui";

const emptyForm = { question: "", optionsText: "" };

export default function AdminPolls() {
  const { data, update } = useSiteData();
  const { polls } = data;
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (p: Poll) => {
    setForm({ question: p.question, optionsText: p.options.join("\n") });
    setEditingId(p.id);
    setFormOpen(true);
  };

  const save = () => {
    if (!form.question.trim()) return;
    const options = form.optionsText.split("\n").map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) return;
    const poll: Poll = {
      id: editingId ?? `poll-${Date.now()}`,
      question: form.question.trim(),
      options: options.slice(0, 6),
      published: true,
    };
    if (editingId) {
      update((d) => ({ ...d, polls: d.polls.map((p) => (p.id === editingId ? poll : p)) }));
    } else {
      update((d) => ({ ...d, polls: [poll, ...d.polls] }));
    }
    void upsertSanityPoll(poll);
    setFormOpen(false);
  };

  const togglePublish = (id: string) => {
    update((d) => ({
      ...d,
      polls: d.polls.map((p) => (p.id === id ? { ...p, published: !p.published } : p)),
    }));
    const target = data.polls.find((p) => p.id === id);
    if (target) void upsertSanityPoll({ ...target, published: !target.published });
  };

  const remove = (id: string) => {
    if (!confirm("Delete this poll permanently?")) return;
    update((d) => ({ ...d, polls: d.polls.filter((p) => p.id !== id) }));
    void deleteSanityPoll(id);
  };

  if (formOpen) {
    return (
      <Card
        title={editingId ? "Edit Poll" : "Add Poll"}
        actions={
          <Btn variant="ghost" small onClick={() => setFormOpen(false)}>
            <ArrowLeft size={13} /> Back
          </Btn>
        }
      >
        <div className="space-y-4">
          <TInput label="Question *" value={form.question} onChange={(v) => setForm({ ...form, question: v })} placeholder="e.g. Who will win IPL 2026?" />
          <TArea
            label="Options (one per line, 2–6)"
            value={form.optionsText}
            onChange={(v) => setForm({ ...form, optionsText: v })}
            rows={6}
            placeholder={"Chennai Super Kings\nMumbai Indians\nRCB\nOther"}
          />
        </div>
        <div className="mt-5 flex gap-2">
          <Btn onClick={save} disabled={!form.question.trim() || form.optionsText.split("\n").filter((o) => o.trim()).length < 2}>
            {editingId ? "Save Changes" : "Publish Poll"}
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
      title={`Polls (${polls.length})`}
      subtitle="Polls shown in the homepage sidebar — visitors vote, results update instantly."
      actions={
        <Btn onClick={openCreate}>
          <Plus size={14} /> Add Poll
        </Btn>
      }
    >
      {polls.length === 0 ? (
        <EmptyState text="No polls yet — click Add Poll." />
      ) : (
        <div className="space-y-2">
          {polls.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-slate-800">{p.question}</div>
                <div className="text-[11px] text-slate-400">
                  {p.options.length} options · {p.published ? "Live on site" : "Hidden"}
                </div>
              </div>
              <Btn variant="secondary" small onClick={() => togglePublish(p.id)}>
                {p.published ? "Hide" : "Show"}
              </Btn>
              <Btn variant="secondary" small onClick={() => openEdit(p)}>
                <Pencil size={12} /> Edit
              </Btn>
              <Btn variant="danger" small onClick={() => remove(p.id)}>
                <Trash2 size={12} /> Del
              </Btn>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
