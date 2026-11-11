#!/usr/bin/env node
/* Browser smoke test: every page must load in Nepali and in English without a script error.
   Serves the site itself, blocks every outside request (so it tests the site, not other people's servers),
   and fails with the list of pages that threw.

   Run:  node tests/smoke.cjs            (needs Playwright: npm install playwright && npx playwright install chromium)
         node tests/smoke.cjs _site      (test a built copy in another folder) */
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path");

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const PORT = 8941, BASE = `http://127.0.0.1:${PORT}/`;

function pages() {
  const out = ["?home"];
  for (const d of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith(".") || d.name === "alerts") continue;
    const f = path.join(ROOT, d.name, "index.html");
    if (fs.existsSync(f) && /data-page=/.test(fs.readFileSync(f, "utf8"))) out.push(d.name + "/");
  }
  out.push("alerts/", "lite/", "embed/?district=gorkha", "feed/?lane=community");
  /* the newest alert's own page, so a missing or broken permalink fails the run */
  try { const a = JSON.parse(fs.readFileSync(path.join(ROOT, "data/alerts.json"), "utf8")).alerts;
    const newest = a.slice().sort((x, y) => (y.sent > x.sent ? 1 : -1))[0]; if (newest) out.push(`alerts/${newest.identifier}/`); } catch (e) {}
  return [...new Set(out)];
}

(async () => {
  const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
  const stop = () => { try { server.kill(); } catch (e) {} };
  process.on("exit", stop);
  await new Promise((r) => setTimeout(r, 1200));
  const browser = await chromium.launch();
  const list = pages(), problems = [];
  for (const lang of ["ne", "en"]) {
    const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript((l) => { try { localStorage.setItem("gati-lang", l); } catch (e) {} }, lang);
    await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    for (let i = 0; i < list.length; i += 6) {
      await Promise.all(list.slice(i, i + 6).map(async (pg) => {
        const page = await ctx.newPage(), errs = [];
        page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
        try {
          const res = await page.goto(BASE + pg, { waitUntil: "load", timeout: 30000 });
          if (!res || res.status() >= 400) errs.push("HTTP " + (res ? res.status() : "no response"));
          await page.waitForTimeout(2500);
          const h1 = await page.locator("h1").count();
          if (!h1 && !/^embed|^lite/.test(pg)) errs.push("no <h1> on the page");
        } catch (e) { errs.push("did not load: " + String(e).slice(0, 120)); }
        if (errs.length) problems.push(`${lang}  ${pg}\n      ${errs.join("\n      ")}`);
        await page.close();
      }));
    }
    await ctx.close();
  }
  await browser.close(); stop();
  console.log(`${list.length} pages x 2 languages checked`);
  if (problems.length) { console.error(`\n${problems.length} page(s) with problems:\n  ` + problems.join("\n  ")); process.exit(1); }
  console.log("no script errors");
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
