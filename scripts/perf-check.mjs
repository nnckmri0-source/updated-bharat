// Performance + mobile UX check via CDP.
// Usage: node scripts/perf-check.mjs  (site running on :3000)

const PORT = process.env.SITE_PORT ?? 3000;
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { spawn } = await import("node:child_process");
  const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userData = "/tmp/cdp-perf-" + Date.now();
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=9223",
    `--user-data-dir=${userData}`,
    "--no-first-run",
    "about:blank",
  ]);

  let tabs = [];
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      tabs = await (await fetch("http://localhost:9223/json")).json();
      if (tabs.length) break;
    } catch {}
  }
  const tab = tabs.find((t) => t.type === "page");
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise((res) => { const id = ++msgId; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) return "ERR: " + JSON.stringify(r.result.exceptionDetails.exception?.description ?? "");
    return r.result?.result?.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.THROTTLE ?? 1) });

  const report = [];

  async function measurePage(name, url, width) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 1400, deviceScaleFactor: 1, mobile: width < 600 });
    await send("Network.enable");
    const t0 = Date.now();
    await send("Page.navigate", { url });
    await sleep(3500);
    const loadMs = Date.now() - t0;

    const metrics = await evaluate(`(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth - doc.clientWidth;
      const imgs = [...document.images];
      return {
        overflow,
        bodyW: doc.scrollWidth,
        viewW: doc.clientWidth,
        imgs: imgs.length,
        lazy: imgs.filter(i => i.loading === "lazy").length,
        heroImg: imgs[0] ? { src: (imgs[0].src || "").slice(0, 60), fetchPriority: imgs[0].fetchPriority || "auto", loading: imgs[0].loading } : null,
        font: document.fonts.status,
      };
    })()`);

    const perf = await evaluate(`(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const res = performance.getEntriesByType("resource");
      const totalBytes = res.reduce((a, r) => a + (r.transferSize || 0), 0);
      const js = res.filter(r => r.initiatorType === "script").reduce((a, r) => a + (r.transferSize || 0), 0);
      const img = res.filter(r => r.initiatorType === "img").reduce((a, r) => a + (r.transferSize || 0), 0);
      return {
        domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        loadEvent: nav ? Math.round(nav.loadEventEnd) : null,
        totalBytesKB: Math.round(totalBytes / 1024),
        jsKB: Math.round(js / 1024),
        imgKB: Math.round(img / 1024),
        resources: res.length,
      };
    })()`);

    report.push({ name, url, width, loadMs, ...metrics, ...perf });
    console.log(`\n[${name}] ${url} @ ${width}px`);
    console.log(`  load: ${loadMs}ms | DCL: ${perf.domContentLoaded}ms | bytes: ${perf.totalBytesKB}KB (js ${perf.jsKB}KB, img ${perf.imgKB}KB)`);
    console.log(`  horizontal overflow: ${metrics.overflow}px (body ${metrics.bodyW} vs view ${metrics.viewW})${metrics.overflow > 0 ? " ⚠️ OVERFLOW" : " ✓"}`);
    console.log(`  images: ${metrics.imgs} (lazy ${metrics.lazy}) | hero: ${JSON.stringify(metrics.heroImg)}`);
  }

  await measurePage("home-mobile", BASE + "/", 390);
  await measurePage("home-desktop", BASE + "/", 1440);
  await measurePage("news-mobile", BASE + "/news/blockbuster-movie-breaks-box-office-records", 390);
  await measurePage("admin-mobile", BASE + "/admin", 390);

  ws.close();
  chrome.kill();
  console.log("\n=== SUMMARY ===");
  for (const r of report) {
    console.log(`${r.name.padEnd(12)} load ${String(r.loadMs).padStart(5)}ms  bytes ${String(r.totalBytesKB).padStart(5)}KB  overflow ${r.overflow}px  ${r.overflow > 0 ? "⚠️" : "✓"}`);
  }
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
