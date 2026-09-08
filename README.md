# Updated Bharat — Next.js Rebuild

**Updated Bharat** — aapki website ka modern rebuild —
**Next.js 16 + React 19 + TypeScript + Tailwind CSS v4** ke saath, original design
ka exact match. 91+ articles, har channel mein posts, sab jagah images.

## Branding

- Site name: **Updated Bharat** (text logo — purana Dainik logo hata diya)
- **Real social media logos** (Facebook, X, Instagram, WhatsApp, YouTube — official SVG brand icons) sidebar, footer strip aur follow widget mein
- Saare ad placeholders par **"Design & Developed by ZORVENT"** (link: https://zorvent.com)
- Ad slots khali hain — article pages par **"Advertise Here"** placeholder box, admin upload kare toh asli ad dikhta hai
- Webkar watermarked ad images (`1777387283_…`, `1777387297_…`) delete kar diye
- Play Store / App Store logic hata diya — sirf website hai, apps nahi

## Tech Stack

| Layer      | Tech |
|------------|------|
| Framework  | Next.js 16 (App Router, Turbopack) |
| UI         | React 19 + Tailwind CSS v4 |
| Language   | TypeScript |
| Icons      | lucide-react |
| Font       | Poppins (next/font) |
| Data       | Firebase RTDB + Admin SDK API routes (`src/app/api`) + localStorage fallback |
| Build      | SSG — 88 static pages + dynamic routes |

## Run locally

```bash
cd bhaskar-next
npm install
npm run dev
# Open http://localhost:3000/
```

Production:

```bash
npm run build && npm run start
```

## Pages

- `/` — Homepage (Web Stories, Hero, Latest, channel widgets, right sidebar)
- `/news/{slug}` — News articles (breadcrumb, share buttons, related news, ads)
- `/channel/{slug}` — Channels (gradient header + card grid)
- `/web-stories` — Web Stories grid
- `/e-newspaper` — E-Paper editions with PDF
- `/latest` — Latest news
- `/search?q=...` — Search (title/channel/content)
- `/bookmarks` — Saved stories (localStorage)
- `/admin` — **Admin Panel** (password-protected, see below)

## 🛠️ Admin Panel (`/admin`)

Admin login/signup hata diya gaya hai — sirf ek password-protected admin panel hai:

- **Default password:** `admin123` (login ke baad **Admin Password** tab se change karo)
- **Dashboard** — stats + quick actions + Reset All Data
- **News Articles** — add / edit / delete (title, slug, channel, date, image, content + **media: YouTube link ya `IMG:` line**)
- **Channels** — add / edit / delete (name, icon, description)
- **Web Stories** — add / edit / delete
- **Homepage** — hero article, sub-featured, latest grid, channel widgets (order/color/style)
- **Ticker & Trending** — breaking news + trending keywords (one per line)
- **Ad Slots** — article page ad images (title/author/in-article/share)
- **Polls** — add / edit / delete / hide
- **E-Paper** — editions add / edit / delete
- **Site Settings** — site name, tagline, logo, social links, **Live URL**, **OneSignal App ID (push)**, **AdSense codes (auto + manual)**
- **Footer** — quick links, tag links, categories
- Images upload: **Upload** button file select karta hai (base64 saved) ya URL paste karo

**Kaise kaam karta hai:** har change localStorage + **Firebase RTDB** (`site` node)
dono par save hota hai aur site par **instantly** reflect hota hai — admin panel se
kiya gaya edit sabhi visitors ko live dikhta hai (realtime listener).

> Login credentials (admin ID/password) sirf usi device ke localStorage mein rehte
> hain — cloud se sync/overwrite nahi hote.

## 🌐 Language — English only

- Hindi/English toggle hata diya gaya hai — poori site **English** mein permanent
- Articles English mein authored hain

## 🔔 Notification System

- Header mein **bell icon with red count badge** — badge bell ke upar dikhta hai (1, 9+, …)
- Dropdown: **Breaking Alerts** (ticker headlines) + **Latest Updates** (naye articles with thumbnails)
- Open karne par auto mark-read; "Mark all read" button; `localStorage` se persist
- Naya article add hote hi badge phir dikhta hai (newest slug se compare)

## 📊 Polls

- **Admin → Polls** — add / edit / delete / hide polls (2–6 options)
- Homepage par **Poll widget** — desktop sidebar + mobile main feed mein
- Visitors vote karte hain, results live % bar ke saath; votes `localStorage` mein

## 🍎 Apple Category

- **Apple channel** — homepage nav + hamburger menu mein (iPhone, Mac, Vision Pro, Watch news)
- 5 articles seed — `channel/apple` page live

## 📢 Push Notifications (OneSignal)

- **Admin → Site Settings → Push Notifications** — OneSignal App ID paste karo
- `SiteHeadInject` SDK load karta hai + `public/OneSignalSDKWorker.js` service worker
- Visitors ko subscribe prompt dikhta hai; notifications OneSignal Dashboard se send karo

## 💰 Google AdSense

- **Admin → Site Settings → Google AdSense** — 3 codes paste karo:
  - **Header script (Auto Ads)** — `<head>` mein inject hota hai (Google auto ads)
  - **In-article ad code** — article body ke 2nd paragraph ke baad
  - **Sidebar ad code** — right sidebar mein (PC side space fill)
- Chahiye: approved AdSense account + site added + ad unit codes

## 🔥 Firebase Backend — CONNECTED ✅ (Admin SDK + API routes)

Backend **Firebase Realtime Database + Firebase Admin SDK** hai — Sanity poori tarah hata diya gaya hai. Site ab **server backend** par chalti hai (static export nahi).

- `src/lib/firebase-admin.ts` — Admin SDK (service account se) — **sirf server par**
- `src/app/api/site` — GET (public read) / PUT + PATCH (admin session cookie zaroori)
- `src/app/api/admin/login` — login verify (credentials Firebase se), HttpOnly signed cookie
- `src/lib/store.tsx` — client: GET se hydrate + RTDB **live listener** (admin edits realtime sabko dikhte hain)
- Admin panel ke har save par: localStorage + `PUT /api/site` (server Admin SDK se RTDB mein likhta hai)
- Firebase config na ho / API down ho to site localStorage fallback par chalti hai (kabhi blank nahi)
- **Security**: RTDB rules = public read-only, writes sirf Admin SDK se (server). Anon writes 401.
- `.env.local` — `NEXT_PUBLIC_FIREBASE_*` (public web config) + `FIREBASE_SERVICE_ACCOUNT_PATH` + `FIREBASE_DATABASE_URL` + `ADMIN_SESSION_SECRET`

**Files**: `firebase-service-account.json` (gitignored — kabhi commit mat karna), `firebase.json`, `database.rules.json`, `.firebaserc`

**Deploy**: `npm run build && npm run start` — kisi bhi Node host par (Vercel/Render/VPS). Service account JSON hosting env vars mein daalo (`FIREBASE_SERVICE_ACCOUNT` inline base64 bhi chalta hai).

**CLI**: `npx firebase deploy --only database` (rules update), `npx firebase projects:list`

## 🎬 Article Media (post ke beech)

- Content mein **YouTube link** apni line par paste karo → video embed ho jata hai
- Line start `IMG:https://…` se karo → inline image paragraph ke beech
- (AdminNews hint mein bhi bataya gaya hai)

## UX extras

- **Light theme only** — dark mode hata diya (sirf light, pure white bg — AajTak/Google style)
- **English only** — Hindi/English toggle hata diya, sab kuch English mein
- **LIVE badge** — ticker mein red blinking LIVE tag + mobile par logo ke bagal (clickable — admin liveUrl khulta hai)
- **Web stories reels** — Instagram reels jaisi 9:16 rounded shape (circle nahi)
- **Category icons** — har category ka apna SVG icon + apna colour (nav, sidebar, mobile menu)
- **Finance category** — homepage par Finance widgets (list + video showcase)
- **Apple category** — Apple channel nav + hamburger mein
- **Sub-featured thumbnails** — hero ke neeche 3 featured posts ab images ke saath
- **Footer menus side-by-side** — quick links + categories side-by-side (space-efficient)
- **Category hover underline** — hover/active par category ke neeche orange line
- **Trending scrollable** — mobile trending strip touch-scrollable + auto-scroll marquee
- **PC layout expanded** — container 1300→1560px, right sidebar 350→380px (side empty space fill), Trending Now widget + Poll + AdSense sidebar
- **Trending widget (sidebar)** — desktop right sidebar mein numbered trending list (pehle khali tha)
- **Breaking ticker pulse dot** (red pulsing indicator)
- **Article reading controls** — A− / A+ text size (0.9×–1.2×)
- **theme-color meta** — browser UI orange theme match
- **Metadata descriptions** — news/channel pages SEO description
- **Admin mobile responsive** — top bar + horizontal tab strip on small screens

## Design System — original site (bhaskar.naws.in) se deep UI/UX alignment

Original ki CSS se ek-ek rule compare karke match kiya gaya:

- **Header** — `#ffffff` bg, 56px bar, search pill (`#f5f5f5`), **orange** ticker label (38px) with LIVE badge, **white** category nav with orange 2px top border + orange active/hover underline
- **Body** — `.site-body` jaisa container (max **1560px**, 16px padding, 18px gap), floating left sidebar (sticky below header, **28px circle nav icons** with orange-light bg), **380px right sidebar** (hidden <1100px)
- **Cards** — 16:9 images, `#fff` cards, hover shadow; hero 16:9 with `opacity .9`, 1.2rem title
- **Widgets** — **navy widget-title bars** (white uppercase text), orange-bordered section heads, navy `#1a1a2e` footer with orange heading underlines
- **Mobile** — original-style text category nav (no pills), red trending label, 58px bottom nav, left sidebar hidden <769px
- Text logo: gradient brand text (jab tak admin logo upload nahi karta)
- Ad placeholders: dashed **"Advertise Here"** box
- Footer col 1: logo + about + social; bottom bar: **Design & Developed by ZORVENT** (zorvent.com)

Verify: `node scripts/layout-check.mjs` — original ke layout metrics se compare (14 checks)

## Performance

- SSG (134 static pages) — DCL ~100ms
- Lazy-loading images (`loading="lazy"`), hero + logo `fetchPriority="high"`
- `content-visibility: auto` on long homepage sections
- Responsive grids (mobile par 1-column), no horizontal overflow
- Scroll-to-top button, `prefers-reduced-motion` respect

Check: `node scripts/perf-check.mjs`

## Auto-verification

```bash
node scripts/admin-flow-test.mjs     # admin login → edit → frontend reflect (8 checks)
node scripts/lang-notif-check.mjs    # language toggle + notification bell (20 checks)
node scripts/mobile-check.mjs        # 11 pages @390px overflow check
node scripts/admin-mobile-check.mjs  # /admin @390px check
```

## Structure

```
src/
├── app/
│   ├── layout.tsx             # Root (fonts + SiteDataProvider)
│   ├── (site)/layout.tsx      # Site chrome (Header + LeftSidebar + Footer + MobileNav)
│   ├── (site)/page.tsx        # Homepage
│   ├── (site)/news/[slug]/    # Article pages (SSG + live client view)
│   ├── (site)/channel/[slug]/ # Channel pages
│   ├── (site)/web-stories/ e-newspaper/ latest/ search/ bookmarks/
│   ├── admin/                 # Admin panel (password gate + sections)
│   └── globals.css            # Design system (orange #f47216, navy #1a1a2e)
├── components/
│   ├── Header, Footer, LeftSidebar, RightSidebar, MobileBottomNav
│   ├── NotificationBell, LanguageToggle, AdSlot, ZorventByline
│   ├── NewsCard, BhaskarRow, WebStoriesRow, SectionHead, ShareButtons
│   └── admin/                 # Admin UI (News, Channels, Stories, Home, Settings…)
├── lib/store.tsx              # Data store: types, defaults, localStorage, useSiteData()
├── lib/i18n.tsx               # Hindi/English UI chrome translation (useLang, t)
└── data/                      # news.ts, channels.ts, stories.ts, site.ts (defaults)
```

## Data pipeline

```bash
node scripts/extract-data.mjs   # bhaskar-clone/ se data extract karta hai
```

- `src/data/news.ts` — **91 articles** (defaults) — **sab mein real, channel-tailored generic content**
- **Har channel mein ≥2 posts** (empty channels seed karna: `node scripts/seed-content.mjs`)
- **Har article ke paas image** (available `uploads/news` images auto-assign)
- Content regenerate: `node scripts/write-content.mjs`
- Article content: har article ke liye channel-appropriate 4-paragraph story (lead, details, reaction, outlook) — koi lorem ipsum nahi
- `src/data/channels.ts` — 33 channels (defaults)
- `src/data/stories.ts` — 14 web stories (defaults)
- `src/data/site.ts` — name (Updated Bharat), ticker, trending, ads (empty), social (defaults)
- Storage key `bhaskar_site_data_v2` — purana localStorage (NewsX/Dainik logo) ignore hota hai

## Assets

`public/` mein saare original assets copy kiye gaye hain:
- `public/icon/` (channel icons)
- `public/uploads/` (logo, stories, news images, ads, e-paper)

## Deploy (Node server — Vercel / Render / VPS)

Site ab **server backend** hai (API routes + Firebase Admin SDK) — static export hata diya gaya:

```bash
npm run build && npm run start   # production server
```

- **Vercel**: repo connect karo ya `vercel --prod` — env vars (`.env.local` wale) Vercel dashboard mein add karo
- **VPS**: `npm run build && npm run start` (pm2/systemd ke saath), reverse proxy port 3000 par
- Env vars zaroori: `FIREBASE_SERVICE_ACCOUNT` (JSON inline, base64 recommended) + `FIREBASE_DATABASE_URL` + `FIREBASE_PROJECT_ID` + `ADMIN_SESSION_SECRET` + `NEXT_PUBLIC_FIREBASE_*`
- `/admin` server-rendered hai; login HttpOnly session cookie deta hai
