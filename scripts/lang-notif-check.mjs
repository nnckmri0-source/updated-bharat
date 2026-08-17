// Verify notification bell + English-only UI on the live site.
// Usage: node scripts/lang-notif-check.mjs  (site running on :3000)

const PORT = process.env.SITE_PORT ?? 3000;
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { spawn } = await import("node:child_process");
  const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chrome = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--remote-debugging-port=9230", "--window-size=1280,900",
    `--user-data-dir=/tmp/cdp-lang-${Date.now()}`, "--no-first-run", "about:blank",
  ]);
  let tabs = [];
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try { tabs = await (await fetch("http://localhost:9230/json")).json(); if (tabs.length) break; } catch {}
  }
  const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res) => { const id = ++msgId; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) return { __err: r.result.exceptionDetails.exception?.description ?? "eval error" };
    return r.result?.result?.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");
  let fails = 0;
  const check = (name, ok, extra = "") => {
    console.log(`${ok ? "✓" : "✗ FAIL"} ${name}${extra ? "  " + extra : ""}`);
    if (!ok) fails++;
  };

  // --- 1. homepage: bell + badge + English-only UI ---
  await send("Page.navigate", { url: BASE + "/" });
  await sleep(2500);
  const initial = await evaluate(`(() => {
    const bell = document.querySelector(".notif-btn");
    const badge = document.querySelector(".notif-badge");
    return {
      hasBell: !!bell,
      hasBadge: !!badge,
      badgeText: badge ? badge.textContent : null,
      hasLangToggle: !!document.querySelector(".lang-toggle"),
      navText: [...document.querySelectorAll(".header-icon-btn span")].map((s) => s.textContent).join("|"),
      trending: document.querySelector(".trending-label")?.textContent ?? null,
    };
  })()`);
  console.log("INITIAL:", JSON.stringify(initial));
  check("notification bell present", initial.hasBell);
  check("unread badge shown on first visit", initial.hasBadge && parseInt(initial.badgeText || "0", 10) > 0, `badge=${initial.badgeText}`);
  check("no language toggle (English only)", !initial.hasLangToggle);
  check("header labels in English", (initial.navText || "").includes("Home") && (initial.navText || "").includes("Notifications") && !(initial.navText || "").includes("Stories"), initial.navText);
  check("trending label in English", (initial.trending || "").toLowerCase().includes("trending"), initial.trending ?? "");

  // --- 2. open bell → panel content ---
  await evaluate(`document.querySelector(".notif-btn").click()`);
  await sleep(800);
  const panel = await evaluate(`(() => {
    const p = document.querySelector(".notif-panel");
    return {
      open: !!p,
      groups: p ? [...p.querySelectorAll(".notif-group-label")].map((g) => g.textContent.trim()) : [],
      items: p ? p.querySelectorAll(".notif-item").length : 0,
      badgeGone: !document.querySelector(".notif-badge"),
    };
  })()`);
  console.log("PANEL:", JSON.stringify(panel));
  check("notification panel opens", panel.open);
  check("breaking alerts group present", panel.groups.some((g) => g.includes("Breaking")), panel.groups.join("|"));
  check("latest updates group present", panel.groups.some((g) => g.includes("Latest")), panel.groups.join("|"));
  check("panel lists items", panel.items >= 5, `items=${panel.items}`);
  check("badge clears after opening (mark read)", panel.badgeGone);
  await evaluate(`document.querySelector(".notif-btn").click()`);
  await sleep(400);

  // --- 3. article page: Advertise Here placeholders, no webkar ---
  await send("Page.navigate", { url: BASE + "/news/exclusive-blockbuster-movie-releases-emerge-as-key-trend-bi9n" });
  await sleep(2500);
  const article = await evaluate(`(() => ({
    placeholders: document.querySelectorAll(".ad-placeholder-title").length,
    hasWebkar: document.body.innerHTML.includes("img_69e6621c009a1"),
    hasZorvent: document.body.innerText.includes("ZORVENT"),
    hasDainik: document.body.innerHTML.includes("dainik-bhaskar"),
    brandText: document.querySelector(".header-brand-text")?.textContent ?? null,
    storyReel: (() => { const r = document.querySelector(".story-ring"); return r ? getComputedStyle(r).borderRadius : null; })(),
  }))()`);
  console.log("ARTICLE:", JSON.stringify(article));
  check("article has Advertise Here placeholders", article.placeholders >= 3, `count=${article.placeholders}`);
  check("no webkar images", !article.hasWebkar);
  check("no dainik logo", !article.hasDainik);
  check("brand = Updated Bharat", article.brandText === "Updated Bharat");
  check("ZORVENT byline still there", article.hasZorvent);

  // --- 4. homepage: story reels are 9:16 rounded (not circles) ---
  await send("Page.navigate", { url: BASE + "/" });
  await sleep(2500);
  const reels = await evaluate(`(() => {
    const r = document.querySelector(".story-ring");
    if (!r) return null;
    const cs = getComputedStyle(r);
    return { w: Math.round(parseFloat(cs.width)), h: Math.round(parseFloat(cs.height)), radius: cs.borderRadius };
  })()`);
  console.log("STORY REELS:", JSON.stringify(reels));
  check("story reels are tall 9:16 (not circles)", !!reels && reels.h > reels.w * 1.4 && !reels.radius.includes("50%"), JSON.stringify(reels));

  ws.close();
  chrome.kill();
  console.log(`\n${fails === 0 ? "ALL CHECKS PASS ✓" : fails + " CHECKS FAILED ⚠️"}`);
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
