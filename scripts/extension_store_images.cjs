/* Build the Chrome Web Store images for the extension: screenshots (1280x800) in light and dark, and the promo
   tiles in light and dark. Loads the real extension in Chromium and serves Gati's data files from this repository.

     node scripts/extension_store_images.cjs        (needs Playwright; PW_CHROMIUM=/path/to/chromium if not bundled)

   Output: extension/store/*.png */
const { chromium } = require("playwright"); const fs = require("fs"); const path = require("path"); const os = require("os");
const ROOT = path.resolve(__dirname, ".."), EXT = path.join(ROOT, "extension"), OUT = path.join(EXT, "store");
const b64 = (f, mime = "image/png") => `data:${mime};base64,` + fs.readFileSync(path.join(ROOT, f)).toString("base64");
const LAUNCH = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : { channel: "chromium" };

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gati-ext-")), pops = {};
  for (const [key, theme, lang, dist] of [["light-en", "light", "en", "NP0436"], ["light-ne", "light", "ne", ""], ["dark-en", "dark", "en", "NP0436"], ["dark-ne", "dark", "ne", ""]]) {
    const ctx = await chromium.launchPersistentContext(path.join(tmp, key), { ...LAUNCH, headless: true, deviceScaleFactor: 2, args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--no-sandbox"] });
    await ctx.route("https://nirajbhusal.github.io/gati-alerts/data/**", (r) => r.fulfill({ contentType: "application/json", body: fs.readFileSync(path.join(ROOT, new URL(r.request().url()).pathname.replace("/gati-alerts/", ""))) }));
    const sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent("serviceworker"), id = sw.url().split("/")[2];
    await sw.evaluate(([l, d, t]) => new Promise((r) => chrome.storage.local.set({ lang: l, district: d, theme: t }, r)), [lang, dist, theme]);
    const p = await ctx.newPage(); await p.setViewportSize({ width: 380, height: 640 }); await p.goto(`chrome-extension://${id}/popup.html`); await p.waitForTimeout(2200);
    pops[key] = path.join(tmp, key + ".png"); await p.screenshot({ path: pops[key], fullPage: true }); await ctx.close();
  }
  const img = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
  const FONT = `@font-face{font-family:Mukta;font-weight:700;src:url(${b64("scripts/fonts/Mukta-Bold.ttf", "font/ttf")})}@font-face{font-family:Mukta;font-weight:400;src:url(${b64("scripts/fonts/Mukta-Regular.ttf", "font/ttf")})}`;
  const TH = { light: { bg: "#FFF6F0", fg: "#0B1F3A", sub: "#4A5568", li: "#1F2A44", arc: "rgba(226,54,43,.07)", logo: b64("assets/img/brand/logo-h.png"), edge: "rgba(11,31,58,.12)", shadow: "rgba(11,31,58,.22)" },
    dark: { bg: "#0B1F3A", fg: "#fff", sub: "#C9D3DF", li: "#E8EDF4", arc: "rgba(255,255,255,.05)", logo: b64("assets/img/brand/logo-h-white.png"), edge: "rgba(255,255,255,.14)", shadow: "rgba(0,0,0,.55)" } };
  const b = await chromium.launch(LAUNCH);
  const shot = async (file, w, h, html) => { const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(`<style>${FONT}*{box-sizing:border-box;margin:0}body{width:${w}px;height:${h}px;overflow:hidden;font-family:Mukta,sans-serif;position:relative}.arc{position:absolute;border-radius:50%}</style>${html}`);
    await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, file) }); await p.close(); };
  const arcs = (t) => `<div class="arc" style="width:900px;height:900px;right:-520px;top:-200px;border:26px solid ${t.arc}"></div><div class="arc" style="width:1300px;height:1300px;right:-760px;top:-400px;border:26px solid ${t.arc}"></div>`;
  const scr = (mode, pop, h1, h2, pts) => { const t = TH[mode]; return `<div style="position:absolute;inset:0;background:${t.bg};color:${t.fg}">${arcs(t)}<div style="position:absolute;inset:0;display:flex;align-items:center;gap:70px;padding:0 90px"><div style="flex:1"><img src="${t.logo}" style="height:74px;display:block;margin-bottom:38px"><div style="font-weight:700;font-size:54px;line-height:1.15">${h1}</div><div style="font-size:27px;color:${t.sub};margin-top:14px;line-height:1.35">${h2}</div><ul style="margin:30px 0 0 0;padding:0;list-style:none;font-size:24px;line-height:1.9;color:${t.li}">${pts.map((x) => `<li><span style="color:#F28C1E;font-weight:700;margin-right:12px">●</span>${x}</li>`).join("")}</ul></div><img src="${img(pop)}" style="height:690px;border-radius:16px;box-shadow:0 24px 70px ${t.shadow};border:1px solid ${t.edge};display:block"></div></div>`; };
  await shot("screenshot-1-light.png", 1280, 800, scr("light", pops["light-en"], "Nepal's official alerts, in your toolbar", "Active alerts for your district, with the agency and the time.", ["Pick your district once", "A badge when an alert names it", "Only official or verified notices"]));
  await shot("screenshot-2-dark.png", 1280, 800, scr("dark", pops["dark-en"], "Dark when your computer is", "Automatic, light or dark: one tap to choose.", ["Follows your system by default", "Easy on the eyes at night", "Same information, same sources"]));
  await shot("screenshot-3-nepali.png", 1280, 800, scr("light", pops["light-ne"], "सही सूचना, सही समयमा ।", "हजुरको जिल्लाका सक्रिय सूचना, स्रोत र समयसहित। नेपाली वा अङ्ग्रेजीमा।", ["DHM को ५ दिने मौसम चेतावनी", "नक्सा, सडक, उडान र आपतकालीन नम्बर", "सबै समय नेपालको समयमा"]));
  /* light and dark side by side */
  const half = (mode, pop, label) => { const t = TH[mode]; return `<div style="flex:1;background:${t.bg};color:${t.fg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;position:relative;overflow:hidden"><div style="font-weight:700;font-size:30px">${label}</div><img src="${img(pop)}" style="height:640px;border-radius:16px;box-shadow:0 20px 60px ${t.shadow};border:1px solid ${t.edge};display:block"></div>`; };
  await shot("screenshot-4-light-and-dark.png", 1280, 800, `<div style="position:absolute;inset:0;display:flex">${half("light", pops["light-en"], "☀ Light")}${half("dark", pops["dark-en"], "☾ Dark")}</div><div style="position:absolute;left:50%;top:26px;transform:translateX(-50%);background:#F28C1E;color:#111;font-weight:700;font-size:22px;padding:6px 22px;border-radius:99px;white-space:nowrap">◐ Automatic follows your computer</div>`);
  await shot("screenshot-5-dark-nepali.png", 1280, 800, scr("dark", pops["dark-ne"], "रातमा पनि सजिलो", "स्वचालित, उज्यालो वा अँध्यारो: एक थिचाइमा छान्नुहोस्।", ["खाता वा ट्र्याकिङ छैन", "हरेक १५ मिनेटमा जाँच", "आधिकारिक वा प्रमाणित सूचना मात्र"]));
  const tile = (mode, k) => { const t = TH[mode]; return `<div style="position:absolute;inset:0;background:${t.bg};color:${t.fg}">${arcs(t)}<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center"><img src="${t.logo}" style="height:${k * 96}px;display:block"><div style="width:${k * 70}px;height:${Math.max(3, k * 5)}px;border-radius:9px;background:#F28C1E;margin:${k * 22}px 0 ${k * 18}px"></div><div style="font-weight:700;font-size:${k * 30}px;line-height:1.2">सही सूचना, सही समयमा ।</div><div style="font-size:${k * 18}px;color:${t.sub};margin-top:${k * 6}px">Official alerts for Nepal, in your browser</div></div></div>`; };
  for (const m of ["light", "dark"]) { await shot(`promo-small-440x280-${m}.png`, 440, 280, tile(m, 0.82)); await shot(`promo-marquee-1400x560-${m}.png`, 1400, 560, tile(m, 1.9)); }
  await b.close(); fs.rmSync(tmp, { recursive: true, force: true });
  console.log(fs.readdirSync(OUT).filter((f) => f.endsWith(".png")).join("\n"));
})();
