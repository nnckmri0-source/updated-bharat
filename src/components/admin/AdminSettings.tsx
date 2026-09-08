"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useSiteData, type FooterLink } from "@/lib/store";
import { Card, Btn, TInput, TArea, ImageInput, SaveBar } from "./ui";

export function AdminSettings() {
  const { data, update, backendReady } = useSiteData();
  const s = data.settings;
  const [form, setForm] = useState({
    name: s.name,
    tagline: s.tagline,
    logo: s.logo,
    footerAbout: s.footerAbout,
    copyright: s.copyright,
    liveUrl: s.liveUrl ?? "",
    facebook: s.social.facebook,
    twitter: s.social.twitter,
    instagram: s.social.instagram,
    youtube: s.social.youtube,
    whatsapp: s.social.whatsapp,
    onesignalAppId: s.onesignalAppId ?? "",
    adsenseHeaderCode: s.adsenseHeaderCode ?? "",
    adsenseInArticleCode: s.adsenseInArticleCode ?? "",
    adsenseSidebarCode: s.adsenseSidebarCode ?? "",
  });
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    update((d) => {
      const next = {
        ...d,
        settings: {
          ...d.settings,
          name: form.name.trim() || d.settings.name,
          tagline: form.tagline.trim(),
          logo: form.logo.trim() || d.settings.logo,
          footerAbout: form.footerAbout.trim(),
          copyright: form.copyright.trim(),
          liveUrl: form.liveUrl.trim(),
          social: { facebook: form.facebook, twitter: form.twitter, instagram: form.instagram, youtube: form.youtube, whatsapp: form.whatsapp },
          onesignalAppId: form.onesignalAppId.trim(),
          adsenseHeaderCode: form.adsenseHeaderCode.trim(),
          adsenseInArticleCode: form.adsenseInArticleCode.trim(),
          adsenseSidebarCode: form.adsenseSidebarCode.trim(),
        },
      };
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-4">
      <Card title="Site Identity" subtitle="Shown in the header logo, footer and browser tab.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TInput label="Site Name" value={form.name} onChange={(v) => set("name", v)} />
          <TInput label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />
          <div className="md:col-span-2">
            <ImageInput label="Logo" value={form.logo} onChange={(v) => set("logo", v)} previewHeight={48} />
          </div>
          <TArea label="Footer About Text" value={form.footerAbout} onChange={(v) => set("footerAbout", v)} rows={2} />
          <TInput label="Footer Copyright Line" value={form.copyright} onChange={(v) => set("copyright", v)} />
          <TInput label="Live Stream URL (YouTube)" value={form.liveUrl} onChange={(v) => set("liveUrl", v)} placeholder="https://www.youtube.com/watch?v=..." />
        </div>
      </Card>

      <Card title="Backend Sync (Firebase Admin API)" subtitle="Every save here goes live for all visitors in realtime — no rebuild needed.">
        <div className={`rounded-lg border px-4 py-3 text-[13px] font-semibold ${backendReady ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
          {backendReady
            ? "Backend connected ✓ — all saves are pushed to Firebase via the server API instantly. Visitors see changes live, no rebuild needed."
            : backendReady === false
              ? "Backend not reachable — saves stay on this device only. Check the server logs and Firebase Admin config (.env.local), then restart."
              : "Checking backend…"}
        </div>
      </Card>

      <Card title="Social Links" subtitle="Facebook, X, Instagram, WhatsApp and YouTube URLs used across the site.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TInput label="Facebook" value={form.facebook} onChange={(v) => set("facebook", v)} />
          <TInput label="X (Twitter)" value={form.twitter} onChange={(v) => set("twitter", v)} />
          <TInput label="Instagram" value={form.instagram} onChange={(v) => set("instagram", v)} />
          <TInput label="WhatsApp" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="https://wa.me/919999999999" />
          <TInput label="YouTube" value={form.youtube} onChange={(v) => set("youtube", v)} />
        </div>
      </Card>

      <Card title="Push Notifications (OneSignal)" subtitle="Web push — visitors subscribe and you send breaking alerts from the OneSignal dashboard.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TInput
            label="OneSignal App ID"
            value={form.onesignalAppId}
            onChange={(v) => set("onesignalAppId", v)}
            placeholder="e.g. 3f2c1a9e-..."
            hint="Found in OneSignal Dashboard → Settings → Keys & IDs. Paste it and visitors get a subscribe prompt."
          />
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-[12px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">How to send notifications:</strong>
          <ol className="mt-2 list-decimal pl-5 space-y-1">
            <li>Create a free account at <a href="https://onesignal.com" target="_blank" rel="noreferrer" className="text-orange-600 font-semibold">onesignal.com</a></li>
            <li>Add your website → copy the App ID → paste it above</li>
            <li>Open OneSignal Dashboard → <strong>Notifications → New</strong></li>
            <li>Write the alert, choose “All Subscribers” → Send</li>
            <li>Every visitor who accepted the prompt gets it instantly 🎉</li>
          </ol>
        </div>
      </Card>

      <Card title="Google AdSense" subtitle="Auto + manual ads. Paste your codes here — the site renders them automatically.">
        <TArea
          label="Header script (Auto Ads)"
          value={form.adsenseHeaderCode}
          onChange={(v) => set("adsenseHeaderCode", v)}
          rows={4}
          hint="The full <script> tag AdSense gives you (with ca-pub-XXXX). This enables Google Auto Ads site-wide."
        />
        <div className="mt-4">
          <TArea
            label="In-article ad code (manual unit)"
            value={form.adsenseInArticleCode}
            onChange={(v) => set("adsenseInArticleCode", v)}
            rows={4}
            hint="Optional manual ad unit shown inside article bodies (after 2nd paragraph)."
          />
        </div>
        <div className="mt-4">
          <TArea
            label="Sidebar ad code (manual unit)"
            value={form.adsenseSidebarCode}
            onChange={(v) => set("adsenseSidebarCode", v)}
            rows={4}
            hint="Optional manual ad unit in the right sidebar — great for filling the empty PC side space."
          />
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-[12px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">What you need (from your Google AdSense account):</strong>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>An approved AdSense account + the site added to it</li>
            <li><strong>Auto ads:</strong> Dashboard → Ads → Auto ads → get the code snippet (ca-pub id)</li>
            <li><strong>Manual ads:</strong> Ads → By ad unit → create unit → copy the code</li>
            <li>Paste both above → Save → ads appear on the live site</li>
          </ul>
        </div>
      </Card>

      <SaveBar onSave={save} saved={saved} />
    </div>
  );
}

export function AdminPassword() {
  const { data, update } = useSiteData();
  const [current, setCurrent] = useState("");
  const [nextId, setNextId] = useState(data.settings.adminUsername);
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const change = () => {
    if (current !== data.settings.adminPassword) {
      setMsg({ ok: false, text: "Current password is incorrect." });
      return;
    }
    if (!nextId.trim()) {
      setMsg({ ok: false, text: "Admin ID cannot be empty." });
      return;
    }
    if (next.trim() && next.trim().length < 4) {
      setMsg({ ok: false, text: "New password must be at least 4 characters." });
      return;
    }
    update((d) => ({
      ...d,
      settings: {
        ...d.settings,
        adminUsername: nextId.trim(),
        adminPassword: next.trim() || d.settings.adminPassword,
      },
    }));
    setCurrent("");
    setNext("");
    setMsg({ ok: true, text: "Admin login updated ✓ — use the new ID/password next time." });
  };

  return (
    <Card
      title="Admin Login (ID + Password)"
      subtitle="Only this ID + password can open the admin panel"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
        <TInput label="Admin ID" value={nextId} onChange={setNextId} placeholder="admin" />
        <TInput label="Current Password (required to save)" value={current} onChange={setCurrent} type="password" />
        <TInput label="New Password (leave blank to keep)" value={next} onChange={setNext} type="password" />
      </div>
      {msg && <p className={`mt-3 text-[13px] font-medium ${msg.ok ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>}
      <div className="mt-4">
        <Btn onClick={change} disabled={!current || !nextId.trim()}>
          Update Login
        </Btn>
      </div>
    </Card>
  );
}

export function AdminFooter() {
  const { data, update } = useSiteData();
  const { footer, channels } = data;
  const [quick, setQuick] = useState<FooterLink[]>(footer.quickLinks.map((l) => ({ ...l })));
  const [tags, setTags] = useState<FooterLink[]>(footer.tags.map((l) => ({ ...l })));
  const [saved, setSaved] = useState(false);

  const save = () => {
    update((d) => ({
      ...d,
      footer: {
        ...d.footer,
        quickLinks: quick.map((l) => ({ title: l.title.trim(), href: l.href.trim() || "/" })).filter((l) => l.title),
        tags: tags.map((l) => ({ title: l.title.trim(), href: l.href.trim() || "/" })).filter((l) => l.title),
      },
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const toggleCategory = (slug: string) =>
    update((d) => {
      const cur = d.footer.categorySlugs;
      return { ...d, footer: { ...d.footer, categorySlugs: cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug] } };
    });

  const linkRow = (list: FooterLink[], setList: (l: FooterLink[]) => void, placeholder: string) => (
    <div className="space-y-2">
      {list.map((l, i) => (
        <div key={i} className="flex gap-2">
          <div className="flex-1">
            <TInput value={l.title} placeholder={placeholder} onChange={(v) => setList(list.map((x, j) => (j === i ? { ...x, title: v } : x)))} />
          </div>
          <div className="w-48">
            <TInput value={l.href} placeholder="/page" onChange={(v) => setList(list.map((x, j) => (j === i ? { ...x, href: v } : x)))} />
          </div>
          <Btn variant="danger" small onClick={() => setList(list.filter((_, j) => j !== i))}>
            <Trash2 size={13} />
          </Btn>
        </div>
      ))}
      <Btn variant="secondary" small onClick={() => setList([...list, { title: "", href: "/" }])}>
        <Plus size={12} /> Add Link
      </Btn>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card title="Quick Links (footer column)" subtitle="Links under “Quick Links” in the footer.">
        {linkRow(quick, setQuick, "Link title…")}
      </Card>

      <Card title="More / Tag Links (footer column)" subtitle="Small pill links under “More” in the footer.">
        {linkRow(tags, setTags, "Tag title…")}
      </Card>

      <Card title="Footer Categories" subtitle="Which channels appear under “Categories” in the footer.">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {channels.filter((c) => c.slug !== "0").map((c) => {
            const checked = footer.categorySlugs.includes(c.slug);
            return (
              <label key={c.slug} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition ${checked ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleCategory(c.slug)} className="accent-orange-500" />
                <span className="truncate">{c.name}</span>
              </label>
            );
          })}
        </div>
      </Card>

      <SaveBar onSave={save} saved={saved} />
    </div>
  );
}
