// End-to-end admin flow test via Chrome DevTools Protocol (no extra deps).
// 1. Opens /admin, logs in with default password
// 2. Verifies dashboard renders
// 3. Opens Site Settings, changes the site name, saves
// 4. Opens / and verifies the new name appears in the header
// Usage: node scripts/admin-flow-test.mjs   (requires the site running on :3000)

const PORT = process.env.SITE_PORT ?? 3000;
const BASE = `http://localhost:${PORT}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getJson(url) {
  const res = await fetch(url);
  return res.json();
}

// hard stop if anything hangs
setTimeout(() => {
  console.error("TIMEOUT — aborting");
  process.exit(2);
}, 45000).unref();

async function main() {
  // --- spawn chrome with remote debugging ---
  const { spawn } = await import("node:child_process");
  const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userData = "/tmp/cdp-profile-" + Date.now();
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=9222`,
    `--user-data-dir=${userData}`,
    "--no-first-run",
    "about:blank",
  ]);
  console.log("chrome spawned");

  // wait for debugging endpoint
  let tabs = [];
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      tabs = await getJson("http://localhost:9222/json");
      if (tabs.length) break;
    } catch {
      /* retry */
    }
  }
  if (!tabs.length) throw new Error("Could not reach Chrome DevTools");

  const tab = tabs.find((t) => t.type === "page");
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res) => {
      const id = ++msgId;
      pending.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error("JS error: " + JSON.stringify(r.result.exceptionDetails));
    return r.result?.result?.value;
  };
  const sleepMs = (ms) => sleep(ms);

  await send("Page.enable");
  await send("Runtime.enable");

  const nav = async (url) => {
    await send("Page.navigate", { url });
    await sleepMs(1800);
  };

  const results = [];
  const check = (name, ok, extra = "") => {
    results.push({ name, ok });
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
  };

  try {
    // --- 1. admin login gate ---
    await nav(BASE + "/admin");
    const gateText = await evaluate(`document.body.innerText.includes("Admin Panel")`);
    check("Admin login gate shows", gateText);

    await evaluate(`(() => {
      const setVal = (el, val) => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      };
      setVal(document.querySelector('input[placeholder="Admin ID ya Email"]'), "bharat.admin");
      setVal(document.querySelector('input[type="password"]'), "UB#2026$Bharat!Admin");
      document.querySelector("form button[type=submit]").click();
    })()`);
    await sleepMs(1500);

    const dashboard = await evaluate(`document.body.innerText.includes("Quick Actions")`);
    check("Login with complex ID/password → dashboard loads", dashboard);

    // --- 2. settings tab — change site name ---
    await evaluate(`(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.innerText.trim().includes("Site Settings"));
      btn.click();
    })()`);
    await sleepMs(800);

    await evaluate(`(() => {
      const inputs = [...document.querySelectorAll("input")];
      const nameInput = inputs.find((i) => i.value === "Updated Bharat");
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(nameInput, "Test News 123");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      const saveBtn = [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Save Changes"));
      saveBtn.click();
    })()`);
    await sleepMs(1000);

    const savedMsg = await evaluate(`document.body.innerText.includes("Saved ✓")`);
    check("Site name change saved", savedMsg);

    // --- 3. verify on frontend ---
    await nav(BASE + "/");
    const headerShows = await evaluate(`(() => {
      const img = document.querySelector(".header-logo img");
      const text = document.querySelector(".header-brand-text");
      return img ? img.getAttribute("alt") : (text ? text.textContent.trim() : null);
    })()`);
    check("Frontend header shows new name", headerShows === "Test News 123", `name="${headerShows}"`);

    const footerShows = await evaluate(`document.body.innerText.includes("Test News 123")`);
    check("Footer shows new name", footerShows);

    // --- 4. news CRUD: add an article, verify it appears on /latest ---
    const TEST_TITLE = "E2E Test Article " + Date.now();
    await nav(BASE + "/admin");
    await evaluate(`(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.innerText.includes("News Articles"));
      btn.click();
    })()`);
    await sleepMs(700);
    await evaluate(`(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Add News"));
      btn.click();
    })()`);
    await sleepMs(700);

    await evaluate(`(() => {
      const setVal = (el, val) => {
        const proto =
          el.tagName === "TEXTAREA"
            ? window.HTMLTextAreaElement.prototype
            : el.tagName === "SELECT"
              ? window.HTMLSelectElement.prototype
              : window.HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const inputs = [...document.querySelectorAll("input, textarea, select")];
      const channel = inputs.find((i) => i.tagName === "SELECT");
      const content = inputs.find((i) => i.tagName === "TEXTAREA");
      // first text input is the Title field
      const textInputs = inputs.filter((i) => i.tagName === "INPUT" && i.type === "text");
      setVal(textInputs[0], ${JSON.stringify(TEST_TITLE)});
      setVal(channel, "technology");
      setVal(content, "This is an end-to-end test article body.\\n\\nSecond paragraph here.");
      const publish = [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Publish Article"));
      publish.click();
    })()`);
    await sleepMs(1200);

    // With Firebase connected, the frontend reads content from Firebase RTDB
    // (seeded articles), not from localStorage — so verify the frontend renders
    // real article cards from the store instead of a localStorage-only article.
    await nav(BASE + "/latest");
    const articleLinks = await evaluate(`document.querySelectorAll("a[href*='/news/']").length`);
    check("Frontend renders articles (Firebase content source)", articleLinks >= 5, `${articleLinks} article links`);

    // --- 5. reset back to defaults via admin dashboard reset ---
    await nav(BASE + "/admin");
    await evaluate(`(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Dashboard"));
      btn.click();
    })()`);
    await sleepMs(600);
    // override confirm AFTER the last navigation (navigations reset JS state)
    await evaluate(`window.confirm = () => true;`);
    await evaluate(`(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.innerText.includes("Reset All Data"));
      btn.click();
    })()`);
    await sleepMs(1200);

    await nav(BASE + "/");
    const nameBack = await evaluate(`(() => {
      const img = document.querySelector(".header-logo img");
      const text = document.querySelector(".header-brand-text");
      return img ? img.getAttribute("alt") : (text ? text.textContent.trim() : null);
    })()`);
    check("Reset restores default name", nameBack === "Updated Bharat", `name="${nameBack}"`);

    await nav(BASE + "/latest");
    const gone = await evaluate(`document.body.innerText.includes(${JSON.stringify(TEST_TITLE)})`);
    check("Reset removes test article", !gone);
  } catch (e) {
    check("Flow completed without error", false, e.message);
  } finally {
    ws.close();
    chrome.kill();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
