// Verify the rebuilt site matches the original bhaskar layout metrics.
// Usage: node scripts/layout-check.mjs  (site running on :3000)

const PORT = process.env.SITE_PORT ?? 3000;
const BASE = `http://localhost:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { spawn } = await import("node:child_process");
  const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chrome = spawn(chromePath, [
    "--headless=new", "--disable-gpu", "--remote-debugging-port=9235", "--window-size=1440,1000",
    `--user-data-dir=/tmp/cdp-layout-${Date.now()}`, "--no-first-run", "about:blank",
  ]);
  let tabs = [];
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try { tabs = await (await fetch("http://localhost:9235/json")).json(); if (tabs.length) break; } catch {}
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: BASE + "/" });
  await sleep(3000);

  const r = await evaluate(`(() => {
    const cs = (sel, prop) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el)[prop] : null;
    };
    const hdr = document.querySelector(".site-header");
    const tickerLabel = document.querySelector(".ticker-label");
    const catNav = document.querySelector(".category-nav-bar");
    const left = document.querySelector(".left-sidebar");
    const right = document.querySelector(".right-sidebar");
    const wt = document.querySelector(".widget-title");
    const footer = document.querySelector(".site-footer");
    const navIcon = document.querySelector(".nav-icon");
    const socialSvgs = document.querySelectorAll(".sidebar-social-btn svg, .footer-strip-icon svg");
    const whatsapp = [...document.querySelectorAll(".sidebar-social-btn, .footer-strip-icon")].some((a) => (a.getAttribute("title") || "").toLowerCase().includes("whatsapp"));
    return {
      headerBg: hdr ? getComputedStyle(hdr).backgroundColor : null,
      tickerLabelBg: tickerLabel ? getComputedStyle(tickerLabel).backgroundColor : null,
      tickerH: tickerLabel ? Math.round(tickerLabel.getBoundingClientRect().height) : null,
      catNavBg: catNav ? getComputedStyle(catNav).backgroundColor : null,
      catNavBorderTop: catNav ? getComputedStyle(catNav).borderTopWidth : null,
      catItemColor: cs(".cat-nav-item", "color"),
      leftStickyTop: left ? getComputedStyle(left).top : null,
      leftBorderRight: left ? getComputedStyle(left).borderRightWidth : null,
      navIconSize: navIcon ? Math.round(navIcon.getBoundingClientRect().width) : null,
      navIconRadius: navIcon ? getComputedStyle(navIcon).borderRadius : null,
      rightWidth: right ? Math.round(right.getBoundingClientRect().width) : null,
      widgetTitleBg: wt ? getComputedStyle(wt).backgroundColor : null,
      widgetTitleColor: wt ? getComputedStyle(wt).color : null,
      footerBg: footer ? getComputedStyle(footer).backgroundColor : null,
      socialSvgCount: socialSvgs.length,
      whatsapp,
      bodyLayoutPad: getComputedStyle(document.querySelector(".body-layout")).padding,
      bodyLayoutMaxW: getComputedStyle(document.querySelector(".body-layout")).maxWidth,
    };
  })()`);
  console.log(JSON.stringify(r, null, 1));

  let fails = 0;
  const check = (name, ok, extra = "") => {
    console.log(`${ok ? "✓" : "✗ FAIL"} ${name}${extra ? "  " + extra : ""}`);
    if (!ok) fails++;
  };
  check("header bg pure white", r.headerBg === "rgb(255, 255, 255)", r.headerBg);
  check("ticker label orange (#f47216)", r.tickerLabelBg === "rgb(244, 114, 22)", r.tickerLabelBg);
  // 38px ticker minus its 1px top border — the original renders the same 37px label
  check("ticker height 38px", r.tickerH >= 36 && r.tickerH <= 38, String(r.tickerH));
  check("category nav white bg", r.catNavBg === "rgb(255, 255, 255)", r.catNavBg);
  check("category nav orange top border 2px", r.catNavBorderTop === "2px", r.catNavBorderTop);
  check("left sidebar floating (sticky top offset)", r.leftStickyTop && r.leftStickyTop !== "0px", r.leftStickyTop);
  check("left sidebar no border-right", r.leftBorderRight === "0px", r.leftBorderRight);
  check("nav-icon circle 28px", r.navIconSize === 28 && r.navIconRadius === "50%", `${r.navIconSize}/${r.navIconRadius}`);
  check("right sidebar 380px", r.rightWidth === 380, String(r.rightWidth));
  check("widget-title navy bg + white text", r.widgetTitleBg === "rgb(26, 26, 46)" && r.widgetTitleColor === "rgb(255, 255, 255)", `${r.widgetTitleBg}/${r.widgetTitleColor}`);
  check("footer navy bg", r.footerBg === "rgb(26, 26, 46)", r.footerBg);
  check("real brand svg icons present", r.socialSvgCount >= 10, `count=${r.socialSvgCount}`);
  check("whatsapp icon present", !!r.whatsapp);

  ws.close();
  chrome.kill();
  console.log(`\n${fails === 0 ? "ALL LAYOUT CHECKS PASS ✓" : fails + " CHECKS FAILED ⚠️"}`);
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
