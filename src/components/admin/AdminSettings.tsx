"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useSiteData, type FooterLink } from "@/lib/store";
import { Card, Btn, TInput, TArea, ImageInput, SaveBar } from "./ui";

export function AdminSettings() {
  const { data, update, backendReady } = useSiteData();
  const s = data.settings;
  const [form, setForm] = useState({
    name: s.name,
    tagline: s.tagline,
    logo: s.logo,
    favicon: s.favicon ?? "",
    socialVisible: s.socialVisible !== false,
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

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    update((d) => {
      const next = {
        ...d,
        settings: {
          ...d.settings,
          name: form.name.trim() || d.settings.name,
          tagline: form.tagline.trim(),
          // Empty value = REMOVE the logo/favicon (intentional — no fallback).
          logo: form.logo.trim(),
          favicon: form.favicon.trim(),
          socialVisible: form.socialVisible,
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
      <Card title="Site Identity" subtitle="Shown in the header logo, footer and browser tab. Clear the field and Save to remove.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TInput label="Site Name" value={form.name} onChange={(v) => set("name", v)} />
          <TInput label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />
          <div className="md:col-span-2">
            <ImageInput label="Logo (clear + Save = remove)" value={form.logo} onChange={(v) => set("logo", v)} previewHeight={48} preset="logo" folder="site" />
          </div>
          <div className="md:col-span-2">
            <ImageInput label="Favicon (browser tab icon — clear + Save = remove)" value={form.favicon} onChange={(v) => set("favicon", v)} previewHeight={32} preset="icon" folder="site" />
          </div>
          <TArea label="Footer About Text" value={form.footerAbout} onChange={(v) => set("footerAbout", v)} rows={2} />
          <TInput label="Footer Copyright Line" value={form.copyright} onChange={(v) => set("copyright", v)} />
          <TInput label="Live Stream URL (YouTube)" value={form.liveUrl} onChange={(v) => set("liveUrl", v)} placeholder="https://www.youtube.com/watch?v=..." />
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
            <input type="checkbox" checked={form.socialVisible} onChange={(e) => set("socialVisible", e.target.checked)} className="h-4 w-4 accent-orange-500" />
            <span className="text-[13px] font-semibold text-slate-700">Show Social Follow icons (sidebar, footer, menu)</span>
          </label>
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
  return (
    <div className="space-y-4">
      <Card
        title="Admin Login — Email Only"
        subtitle="Login is done only via the allowlisted email + password (Firebase Auth). Password reset: 'Forgot password?' on the login screen sends a secure reset link to the email."
      >
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[13px] font-semibold text-green-700">
          Login email: <strong>nnckmri0@gmail.com</strong> — koi aur email ID/password se admin panel nahi khulega.
        </div>
      </Card>

      <AdminEmails />
    </div>
  );
}

/** Email-based admin logins (Firebase Auth) — allowlist managed here. */
function AdminEmails() {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/emails", { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as { emails: string[] };
          setEmails(json.emails ?? []);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  };

  useEffect(load, []);

  const updateList = async (email: string, allowed: boolean) => {
    setMsg(null);
    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, allowed }),
      });
      const json = (await res.json()) as { ok: boolean; emails?: string[]; error?: string };
      if (res.ok && json.emails) {
        setEmails(json.emails);
        setMsg({ ok: true, text: allowed ? `${email} can now log in with email + password.` : `${email} removed.` });
        setNewEmail("");
      } else {
        setMsg({ ok: false, text: json.error || "Update failed." });
      }
    } catch {
      setMsg({ ok: false, text: "Server unreachable — try again." });
    }
  };

  return (
    <Card
      title="Email Logins (Firebase Auth)"
      subtitle="Add an email, then log in on the panel with that email + any password (min 6 chars). 'Forgot password' sends a reset link to the email."
    >
      <div className="flex gap-2 max-w-xl">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="admin@example.com"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
        />
        <Btn onClick={() => void updateList(newEmail.trim(), true)} disabled={!newEmail.trim()}>
          <Plus size={13} /> Add Email
        </Btn>
      </div>
      {msg && <p className={`mt-3 text-[13px] font-medium ${msg.ok ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>}
      <div className="mt-4 max-w-xl space-y-2">
        {loading && <p className="text-[13px] text-slate-400">Loading…</p>}
        {!loading && emails.length === 0 && <p className="text-[13px] text-slate-400">No email logins added yet — abhi sirf Admin ID + password se login hota hai.</p>}
        {emails.map((email) => (
          <div key={email} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
            <span className="truncate text-[13px] font-semibold text-slate-700">{email}</span>
            <button type="button" onClick={() => void updateList(email, false)} className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100">
              Remove
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Password reset: panel ke login screen par &quot;Forgot password?&quot; — Firebase khud email par secure reset link bhejta hai.
      </p>
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
