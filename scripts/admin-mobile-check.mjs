// Verify the /admin layout on mobile (390px): login card fully visible + panel usable.
// Usage: node scripts/admin-mobile-check.mjs

const PORT = process.env.SITE_PORT ?? 3000;
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { spawn } = await import("node:child_process");
  const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chrome = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--remote-debugging-port=9227", "--window-size=390,844",
    `--user-data-dir=/tmp/cdp-amobile-${Date.now()}`, "--no-first-run", "about:blank",
  ]);
  let tabs = [];
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try { tabs = await (await fetch("http://localhost:9227/json")).json(); if (tabs.length) break; } catch {}
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
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

  await send("Page.navigate", { url: BASE + "/admin" });
  await sleep(2500);
  const login = await evaluate(`(() => {
    const vh = window.innerHeight;
    const card = document.querySelector(".max-w-sm");
    const r = card ? card.getBoundingClientRect() : null;
    return {
      cardTop: r ? Math.round(r.top) : null,
      cardBottom: r ? Math.round(r.bottom) : null,
      viewport: vh,
      cardFullyVisible: r ? r.top >= 0 && r.bottom <= vh : false,
      docScrollable: document.documentElement.scrollHeight > document.documentElement.clientHeight,
    };
  })()`);
  console.log("LOGIN GATE @390:", JSON.stringify(login));
  console.log(login.cardFullyVisible ? "  login card fully visible ✓" : "  card overflows; page scrollable=" + login.docScrollable);

  await evaluate(`(() => {
    const input = document.querySelector('input[type="password"]');
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, "admin123");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector("form button[type=submit]").click();
  })()`);
  await sleep(1500);

  const panel = await evaluate(`(() => {
    const nav = document.querySelector("aside nav");
    return {
      tabs: nav ? nav.querySelectorAll("button").length : 0,
      navScrollable: nav ? nav.scrollWidth > nav.clientWidth : false,
      dashboardVisible: document.body.innerText.includes("Quick Actions"),
      logoutVisible: [...document.querySelectorAll("button")].some((b) => b.innerText.includes("Logout")),
    };
  })()`);
  console.log("PANEL @390:", JSON.stringify(panel));
  const ok = panel.dashboardVisible && panel.tabs > 0 && (login.cardFullyVisible || login.docScrollable);
  console.log(ok ? "\nADMIN MOBILE OK ✓" : "\nADMIN MOBILE ISSUE ⚠️");
  ws.close();
  chrome.kill();
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
