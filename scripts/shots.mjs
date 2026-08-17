// Final visual screenshots (desktop, mobile, notif panel, hindi mode).
// Usage: node scripts/shots.mjs  (site running on :3000)

const PORT = process.env.SITE_PORT ?? 3000;
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { spawn } = await import("node:child_process");
  const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chrome = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--remote-debugging-port=9233", "--window-size=1280,900",
    `--user-data-dir=/tmp/cdp-shots-${Date.now()}`, "--no-first-run", "about:blank",
  ]);
  let tabs = [];
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try { tabs = await (await fetch("http://localhost:9233/json")).json(); if (tabs.length) break; } catch {}
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
  const shot = async (name) => {
    const r = await send("Page.captureScreenshot", { format: "png" });
    const { writeFileSync } = await import("node:fs");
    writeFileSync(`/tmp/${name}.png`, Buffer.from(r.result.data, "base64"));
    console.log("saved /tmp/" + name + ".png");
  };

  await send("Page.enable");
  await send("Runtime.enable");

  // desktop home
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: BASE + "/" });
  await sleep(3000);
  await shot("ub-home-desktop");

  // notification panel open
  await evaluate(`document.querySelector(".notif-btn").click()`);
  await sleep(800);
  await shot("ub-notif-panel");
  await evaluate(`document.querySelector(".notif-btn").click()`);
  await sleep(300);

  // hindi mode
  await evaluate(`[...document.querySelectorAll(".lang-toggle button")].find((b) => b.textContent.trim() === "हिंदी").click()`);
  await sleep(800);
  await shot("ub-home-hindi");

  // back to english, mobile home
  await evaluate(`[...document.querySelectorAll(".lang-toggle button")].find((b) => b.textContent.trim() === "EN").click()`);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send("Page.navigate", { url: BASE + "/" });
  await sleep(3000);
  await shot("ub-home-mobile");

  // mobile article (advertise here boxes)
  await send("Page.navigate", { url: BASE + "/news/ai-breakthrough-new-model-mimics-human-reasoning" });
  await sleep(3000);
  await shot("ub-article-mobile");

  ws.close();
  chrome.kill();
  console.log("DONE");
  process.exit(0);
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
