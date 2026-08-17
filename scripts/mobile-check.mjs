// Mobile layout check across all key pages at 390px.
// Usage: node scripts/mobile-check.mjs  (site running on :3000)

const PORT = process.env.SITE_PORT ?? 3000;
const BASE = `http://localhost:${PORT}`;
const PATHS = [
  "/",
  "/latest",
  "/web-stories",
  "/e-newspaper",
  "/bookmarks",
  "/search?q=budget",
  "/news/ipl-2026-high-scoring-thriller-decided-in-final-over",
  "/news/blockbuster-movie-breaks-box-office-records",
  "/channel/ipl-2026",
  "/channel/local",
  "/admin",
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { spawn } = await import("node:child_process");
  const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chrome = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--remote-debugging-port=9225", "--window-size=390,1400",
    `--user-data-dir=/tmp/cdp-mobile-${Date.now()}`, "--no-first-run", "about:blank",
  ]);
  let tabs = [];
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try { tabs = await (await fetch("http://localhost:9225/json")).json(); if (tabs.length) break; } catch {}
  }
  const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res) => { const id = ++msgId; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 1400, deviceScaleFactor: 1, mobile: true });

  let fails = 0;
  for (const p of PATHS) {
    await send("Page.navigate", { url: BASE + p });
    await sleep(2500);
    const r = await evaluate(`(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth - doc.clientWidth;
      const isClipped = (el) => { let n = el.parentElement; while (n && n !== document.body) { const s = getComputedStyle(n); if (["hidden","auto","scroll"].includes(s.overflowX)) return true; n = n.parentElement; } return false; };
      let culprit = null;
      document.querySelectorAll("*").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > doc.clientWidth + 1 && rect.width > 10 && !isClipped(el) && !culprit) {
          culprit = (el.tagName + "." + (el.className || "").toString().slice(0, 40));
        }
      });
      const noImages = [...document.querySelectorAll("article img, .news-card img, .hero-card img")].filter(i => !i.src).length;
      return { overflow, culprit, bodyW: doc.scrollWidth, viewW: doc.clientWidth };
    })()`);
    const status = r.overflow > 0 ? `⚠️ OVERFLOW ${r.overflow}px (${r.culprit})` : "✓";
    if (r.overflow > 0) fails++;
    console.log(`${status.padEnd(48)} ${p}`);
  }
  ws.close();
  chrome.kill();
  console.log(`\n${fails === 0 ? "ALL PAGES CLEAN ✓" : fails + " pages with overflow ⚠️"}`);
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
