// Find elements wider than the viewport (overflow culprits).
// Usage: node scripts/find-overflow.mjs <path>

const PORT = process.env.SITE_PORT ?? 3000;
const path = process.argv[2] ?? "/news/blockbuster-movie-breaks-box-office-records";
const url = `http://localhost:${PORT}${path}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { spawn } = await import("node:child_process");
  const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chrome = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--remote-debugging-port=9224", "--window-size=390,1400",
    `--user-data-dir=/tmp/cdp-overflow-${Date.now()}`, "--no-first-run", "about:blank",
  ]);
  let tabs = [];
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try { tabs = await (await fetch("http://localhost:9224/json")).json(); if (tabs.length) break; } catch {}
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
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 1400, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url });
  await sleep(3500);

  const base = await evaluate(`(() => ({
    innerW: window.innerWidth,
    htmlClient: document.documentElement.clientWidth,
    htmlScroll: document.documentElement.scrollWidth,
    bodyScroll: document.body.scrollWidth,
    metaViewport: document.querySelector('meta[name="viewport"]')?.content || null,
  }))()`);
  console.log("Viewport info:", JSON.stringify(base));

  const widest = await evaluate(`(() => {
    let best = null;
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > (best?.right ?? 0)) best = { tag: el.tagName, cls: (el.className || "").toString().slice(0, 60), right: Math.round(r.right), w: Math.round(r.width), pos: getComputedStyle(el).position };
    });
    return best;
  })()`);
  console.log("Widest element:", JSON.stringify(widest));

  const bad = await evaluate(`(() => {
    const vw = document.documentElement.clientWidth;
    const isClipped = (el) => {
      let n = el.parentElement;
      while (n && n !== document.body) {
        const s = getComputedStyle(n);
        if (s.overflowX === "hidden" || s.overflowX === "auto" || s.overflowX === "scroll") return true;
        n = n.parentElement;
      }
      return false;
    };
    const chain = (el) => {
      const parts = [];
      let n = el;
      while (n && n !== document.documentElement) {
        parts.push({ tag: n.tagName, cls: (n.className || "").toString().slice(0, 50) });
        n = n.parentElement;
      }
      return parts.slice(0, 6);
    };
    const out = [];
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width > 10 && !isClipped(el)) {
        out.push({ tag: el.tagName, cls: (el.className || "").toString().slice(0, 60), right: Math.round(r.right), width: Math.round(r.width), text: (el.innerText || "").slice(0, 40), chain: chain(el) });
      }
    });
    return out.slice(0, 6);
  })()`);
  console.log("Overflowing elements (mobile 390px):");
  console.log(JSON.stringify(bad, null, 2));

  ws.close();
  chrome.kill();
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
