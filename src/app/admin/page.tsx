"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Newspaper,
  FolderOpen,
  Images,
  Home,
  Radio,
  Megaphone,
  BookOpen,
  Settings,
  Link2,
  KeyRound,
  LogOut,
  ExternalLink,
  BarChart3,
  Eye,
  EyeOff,
} from "lucide-react";
import { useSiteData, ADMIN_AUTH_KEY } from "@/lib/store";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminNews from "@/components/admin/AdminNews";
import AdminChannels from "@/components/admin/AdminChannels";
import AdminStories from "@/components/admin/AdminStories";
import AdminHome from "@/components/admin/AdminHome";
import AdminContent from "@/components/admin/AdminContent";
import { AdminAds, AdminEPaper } from "@/components/admin/AdminAds";
import { AdminSettings, AdminPassword, AdminFooter } from "@/components/admin/AdminSettings";
import AdminPolls from "@/components/admin/AdminPolls";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "news", label: "News Articles", icon: Newspaper },
  { id: "channels", label: "Channels", icon: FolderOpen },
  { id: "stories", label: "Web Stories", icon: Images },
  { id: "home", label: "Homepage", icon: Home },
  { id: "ticker", label: "Ticker & Trending", icon: Radio },
  { id: "ads", label: "Ad Slots", icon: Megaphone },
  { id: "polls", label: "Polls", icon: BarChart3 },
  { id: "epaper", label: "E-Paper", icon: BookOpen },
  { id: "settings", label: "Site Settings", icon: Settings },
  { id: "footer", label: "Footer", icon: Link2 },
  { id: "password", label: "Admin Login", icon: KeyRound },
];

export default function AdminPage() {
  const { data, backendReady } = useSiteData();
  // SSR-safe: always start logged OUT so the server HTML and the client's first
  // render match (no hydration mismatch). The saved session is restored in an
  // effect after mount — one frame later, no flicker on the login screen.
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    void (async () => {
      // Session restore ONLY via the server (HttpOnly cookie verified against
      // Firebase). No localStorage auto-login — a saved flag must never open
      // the panel without valid credentials.
      try {
        const res = await fetch("/api/admin/login", { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as { authed: boolean };
          if (json.authed) {
            setAuthed(true);
            return;
          }
        }
      } catch {
        /* API unreachable — stay logged out */
      }
      // Legacy cleanup: drop the old always-trusted localStorage flag.
      try { localStorage.removeItem(ADMIN_AUTH_KEY); } catch { /* ignore */ }
    })();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    // Server-side check ONLY: credentials are verified against Firebase (Admin
    // SDK / Firebase Auth) and a signed HttpOnly session cookie is issued.
    setErrorText("");
    setBusy(true);
    try {
      const identifier = username.trim();
      const isMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(isMail ? { email: identifier, password } : { username: identifier, password }),
      });
      if (res.ok) {
        setAuthed(true);
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setErrorText(json.error || "Wrong ID/email or password — try again.");
    } catch {
      setErrorText("Server unreachable — try again.");
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async () => {
    setResetMsg("");
    if (!resetEmail.trim()) {
      setResetMsg("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      setResetMsg(json.message || json.error || (res.ok ? "Reset link sent." : "Could not send reset email."));
    } catch {
      setResetMsg("Server unreachable — try again.");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    void fetch("/api/admin/login", { method: "DELETE" }).catch(() => { /* ignore */ });
    try {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    } catch {
      /* ignore */
    }
    setAuthed(false);
  };

  // ---------- Login gate ----------
  if (!authed) {
    return (
      <div className="flex min-h-[100dvh] overflow-y-auto bg-slate-100 px-4 py-6" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="m-auto w-full max-w-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-extrabold text-white">
                {data.settings.name.slice(0, 1).toUpperCase()}
              </div>
              <h1 className="text-lg font-extrabold text-slate-800">Admin Panel</h1>
              <p className="mt-1 text-[12px] text-slate-400">Manage {data.settings.name} — everything on the site</p>
            </div>
            {resetMode ? (
              <div className="space-y-3">
                <p className="text-[12px] text-slate-500">Enter your admin email — Firebase will send a password reset link to it.</p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setResetMsg("");
                  }}
                  placeholder="admin@example.com"
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                {resetMsg && <p className={`text-[12px] font-medium ${resetMsg.includes("sent") ? "text-green-600" : "text-red-500"}`}>{resetMsg}</p>}
                <button type="button" onClick={() => void sendReset()} disabled={busy} className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60">
                  {busy ? "Sending…" : "Send Reset Link"}
                </button>
                <button type="button" onClick={() => { setResetMode(false); setResetMsg(""); }} className="w-full text-[12px] font-semibold text-slate-400 hover:text-slate-600">
                  ← Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={login} className="space-y-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorText("");
                  }}
                  placeholder="Admin ID ya Email"
                  autoFocus
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorText("");
                    }}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 pr-11 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                    title={showPass ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errorText && <p className="text-[12px] font-medium text-red-500">{errorText}</p>}
                <button type="submit" disabled={busy} className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60">
                  {busy ? "Logging in…" : "Login to Admin"}
                </button>
                <button type="button" onClick={() => setResetMode(true)} className="w-full text-[12px] font-semibold text-slate-400 hover:text-orange-500">
                  Forgot password? (email par reset link bhejo)
                </button>
              </form>
            )}
            <Link href="/" className="mt-4 block text-center text-[12px] font-semibold text-orange-500 hover:underline">
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Panel ----------
  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-100 md:flex-row" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Sidebar (mobile: top bar + horizontal tabs; desktop: left column) */}
      <aside className="shrink-0 bg-navy text-white md:flex md:w-60 md:flex-col" style={{ background: "#1a1a2e" }}>
        <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5 md:px-5 md:py-5">
          <div className="text-[13px] font-extrabold leading-tight md:text-[15px]">
            ⚡ {data.settings.name}
            <span className="block text-[10px] font-medium text-white/50 md:text-[11px]">Admin Panel</span>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-[10px] font-bold text-white/70 hover:bg-white/10 md:hidden">
            <LogOut size={11} /> Logout
          </button>
        </div>
        <nav className="flex overflow-x-auto md:flex-1 md:flex-col md:overflow-y-auto md:py-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-3.5 py-2 text-left text-[12px] font-semibold transition md:gap-3 md:px-5 md:py-2.5 md:text-[13px] ${
                tab === t.id
                  ? "border-b-[3px] border-orange-500 bg-white/10 text-white md:border-b-0 md:border-l-[3px]"
                  : "border-b-[3px] border-transparent text-white/60 hover:bg-white/5 hover:text-white md:border-l-[3px]"
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 md:block">
          <Link href="/" target="_blank" className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-[12px] font-bold text-white hover:bg-white/20">
            <ExternalLink size={13} /> View Website
          </Link>
          <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 py-2 text-[12px] font-bold text-white/70 hover:bg-white/10">
            <LogOut size={13} /> Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-3.5 py-2.5 backdrop-blur md:px-7 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-extrabold text-slate-800 md:text-[17px]">{TABS.find((t) => t.id === tab)?.label}</h1>
              <p className="hidden text-[11px] text-slate-400 sm:block">Every save syncs to Firebase — live for all visitors in realtime, no rebuild needed.</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold md:px-3 md:py-1 md:text-[11px] ${backendReady === false ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
              {backendReady === false ? "○ Offline" : "● Live"}
            </span>
          </div>
        </header>
        <main className="p-3 md:p-7">
          {tab === "dashboard" && <AdminDashboard onNavigate={setTab} />}
          {tab === "news" && <AdminNews />}
          {tab === "channels" && <AdminChannels />}
          {tab === "stories" && <AdminStories />}
          {tab === "home" && <AdminHome />}
          {tab === "ticker" && <AdminContent />}
          {tab === "ads" && <AdminAds />}
          {tab === "polls" && <AdminPolls />}
          {tab === "epaper" && <AdminEPaper />}
          {tab === "settings" && <AdminSettings />}
          {tab === "footer" && <AdminFooter />}
          {tab === "password" && <AdminPassword />}
        </main>
      </div>
    </div>
  );
}
