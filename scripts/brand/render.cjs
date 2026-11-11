/* Turns the vector logo into every brand file: PNG logos and icons, social
   profile pictures, covers and thumbnails, the brand guidelines PDF and the
   maintainer's visiting card. Run through scripts/make_brand_kit.py. */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), os = require("os");

const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "assets/brand");
const LOGOS = path.join(OUT, "logos");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "gati-brand-"));
const C = { red: "#E2362B", navy: "#0B1424", crimson: "#DC143C", teal: "#0F7C86", glacier: "#7FD1D8",
  snow: "#F7F9FB", ink: "#14202B", slate: "#4A5A6A", mist: "#D5DEE7", orange: "#F28C1E" };
const SITE = "nirajbhusal.github.io/gati-alerts";
const PHONE = process.env.GATI_CARD_PHONE || ""; // set this when building a private copy of the visiting card with a phone number
const svg = (n) => fs.readFileSync(path.join(LOGOS, n + ".svg"), "utf8").replace(/ width="\d+" height="\d+"/, "");
const font = (w) => "file://" + path.join(ROOT, "scripts/fonts/Mukta-" + w + ".ttf");
const BASE = `
@font-face{font-family:Mukta;font-weight:400;src:url(${font("Regular")})}
@font-face{font-family:Mukta;font-weight:600;src:url(${font("SemiBold")})}
@font-face{font-family:Mukta;font-weight:700;src:url(${font("Bold")})}
@font-face{font-family:Sora;font-weight:600;src:url(file://${path.join(ROOT, "scripts/fonts/sora-latin-600-normal.woff2")})}
@font-face{font-family:Sora;font-weight:700;src:url(file://${path.join(ROOT, "scripts/fonts/sora-latin-700-normal.woff2")})}
*{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}
.ne{font-family:Mukta,sans-serif}
svg{display:block}`;
const mk = (d) => fs.mkdirSync(path.join(OUT, d), { recursive: true });

/* the three signal arcs, large and faint, as a background motif */
const motif = (color, o) => `<svg viewBox="0 0 600 600" style="position:absolute;right:-20%;top:50%;height:170%;transform:translateY(-50%)" fill="none" stroke="${color}" stroke-linecap="round" stroke-width="26">
<path d="M190 215 A110 110 0 0 1 190 385" opacity="${o}"/><path d="M270 130 A220 220 0 0 1 270 470" opacity="${o * 0.7}"/><path d="M350 50 A330 330 0 0 1 350 550" opacity="${o * 0.45}"/></svg>`;

const THEMES = {
  navy: { bg: C.navy, fg: "#fff", sub: "#C9D3DF", logo: "gati-logo-horizontal-white", arc: ["#fff", 0.07] },
  red: { bg: C.red, fg: "#fff", sub: "#FFE3E0", logo: "gati-glyph-white", arc: ["#fff", 0.16] },
  light: { bg: C.snow, fg: C.navy, sub: C.slate, logo: "gati-logo-horizontal", arc: [C.red, 0.1] },
};

/* one banner. layout "center" stacks logo and tagline; "wide" puts them side by side.
   safe = [w, h] keeps everything inside a centred box (YouTube, Facebook crops). */
function banner({ w, h, theme = "navy", layout = "center", safe, url = true, head }) {
  const t = THEMES[theme], sw = safe ? safe[0] : w, sh = safe ? safe[1] : h;
  const u = Math.min(sh / (layout === "wide" ? 3.4 : head ? 7.4 : 6.2), sw / (layout === "wide" ? 15 : head ? 13 : 9.5));
  const red = theme === "red";
  const logo = red
    ? `<div style="display:flex;align-items:center;gap:${u * 0.2}px"><div style="height:${u * 2.6}px;width:${u * 2.6}px">${svg("gati-glyph-white")}</div><div style="height:${u * 1.5}px;width:${u * 2.2}px">${svg("gati-wordmark-white")}</div></div>`
    : `<div style="height:${u * 2.6}px;width:${u * 2.6 * 1080 / 512}px">${svg(t.logo)}</div>`;
  const rule = `<div style="width:${u * 1.3}px;height:${Math.max(3, u * 0.07)}px;border-radius:9px;background:${red ? "#fff" : C.orange};margin:${u * 0.5}px 0"></div>`;
  const tag = `<div class="ne" style="font-weight:700;font-size:${u * 0.52}px;line-height:1.25;color:${t.fg}">सही सूचना, सही समयमा ।</div>
<div style="font-size:${u * 0.3}px;color:${t.sub};margin-top:${u * 0.12}px">The right alert, right on time.</div>`;
  const web = url ? `<div style="font-size:${u * 0.22}px;letter-spacing:.04em;color:${t.sub};opacity:.85;margin-top:${u * 0.45}px">${SITE}</div>` : "";
  const hd = head ? `<div class="ne" style="font-weight:700;font-size:${u * 0.95}px;line-height:1.15;color:${t.fg};margin-top:${u * 0.55}px;white-space:nowrap">${head[0]}</div>
<div style="font-weight:600;font-size:${u * 0.36}px;line-height:1.3;color:${t.sub};margin-top:${u * 0.2}px;max-width:${sw * 0.84}px">${head[1]}</div>` : "";
  const inner = layout === "wide"
    ? `<div style="display:flex;align-items:center;gap:${u * 0.9}px">${logo}<div style="width:2px;align-self:stretch;background:${t.sub};opacity:.3"></div><div>${tag}${web}</div></div>`
    : head ? `${logo}${hd}${web}` : `${logo}${rule}${tag}${web}`;
  return `<style>${BASE}body{width:${w}px;height:${h}px;background:${t.bg};overflow:hidden;position:relative}</style>
${motif(t.arc[0], t.arc[1])}
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">${inner}</div>`;
}

/* profile picture: the glyph kept inside the circle every platform crops to */
const profile = (s, bg) => `<style>${BASE}body{width:${s}px;height:${s}px;background:${bg};display:flex;align-items:center;justify-content:center}</style>
<div style="width:${s * 0.7}px;height:${s * 0.7}px;margin-left:${s * 0.035}px">${svg("gati-glyph-white")}</div>`;
const plain = (name, s, pad = 0, bg = "transparent") => `<style>${BASE}body{width:${s}px;height:${s}px;background:${bg};padding:${pad}px}</style>${svg(name)}`;

const HEAD = ["आधिकारिक विपद् सूचना,<br>स्रोत र समयसहित", "Nepal's official disaster alerts, with source and time"];
const SOCIAL = [
  /* covers and headers */
  ["social/covers/x-header-1500x500", { w: 1500, h: 500, layout: "wide" }],
  ["social/covers/linkedin-page-cover-1128x191", { w: 1128, h: 191, layout: "wide", url: false }],
  ["social/covers/linkedin-profile-banner-1584x396", { w: 1584, h: 396, layout: "wide" }],
  ["social/covers/facebook-cover-1640x624", { w: 1640, h: 624, safe: [1100, 500] }],
  ["social/covers/youtube-banner-2560x1440", { w: 2560, h: 1440, safe: [1235, 338] , layout: "wide"}],
  ["social/covers/github-social-preview-1280x640", { w: 1280, h: 640 }],
  ["social/covers/telegram-viber-cover-1280x720", { w: 1280, h: 720 }],
  ["social/covers/share-cover-1200x630", { w: 1200, h: 630 }],
  ["social/covers/share-cover-light-1200x630", { w: 1200, h: 630, theme: "light" }],
  ["social/covers/presentation-title-1920x1080", { w: 1920, h: 1080 }],
  /* thumbnails */
  ["social/thumbnails/youtube-thumbnail-1280x720", { w: 1280, h: 720, head: HEAD, url: false }],
  ["social/thumbnails/youtube-thumbnail-red-1280x720", { w: 1280, h: 720, theme: "red", head: HEAD, url: false }],
  ["social/thumbnails/youtube-thumbnail-light-1280x720", { w: 1280, h: 720, theme: "light", head: HEAD, url: false }],
  ["social/thumbnails/link-thumbnail-1200x628", { w: 1200, h: 628, head: HEAD }],
  /* posts and stories */
  ["social/posts/post-square-1080x1080", { w: 1080, h: 1080, head: HEAD }],
  ["social/posts/post-square-red-1080x1080", { w: 1080, h: 1080, theme: "red" }],
  ["social/posts/post-portrait-1080x1350", { w: 1080, h: 1350, head: HEAD }],
  ["social/posts/story-1080x1920", { w: 1080, h: 1920, safe: [1080, 1300], head: HEAD }],
];
const PROFILES = [["x", 400], ["linkedin", 400], ["facebook", 720], ["instagram", 1080], ["youtube", 800], ["tiktok", 720],
  ["telegram", 640], ["viber", 720], ["whatsapp", 640], ["github", 500]];

/* ---------- visiting card ---------- */
function card(bleed) {
  const W = 90 + bleed * 2, H = 54 + bleed * 2, p = 6 + bleed;
  const qr = fs.readFileSync(path.join(TMP, "..", "gati-qr.svg"), "utf8");
  /* contact icons: phone and globe are drawn here; X, LinkedIn and GitHub marks are from Simple Icons (CC0) */
  const ICON = {
    TEL: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6.6 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6 6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.700 2 2 0 0 1 6.6 3.5Z"/>',
    WEB: '<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.200 3 14.800 0 18M12 3c-3 3.200-3 14.800 0 18"/></g>',
    X: '<path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
    IN: '<path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>',
    GIT: '<path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
  };
  const row = (k, v) => `<div style="display:flex;gap:1.5mm;align-items:center"><svg viewBox="0 0 24 24" style="width:2.5mm;height:2.5mm;color:${C.red};flex:none">${ICON[k]}</svg><span style="width:5.2mm;font:700 4.3pt Sora;letter-spacing:.1em;color:${C.slate}">${k}</span><span style="font-size:${PHONE ? 6.2 : 6.7}pt;line-height:1.25;color:${C.ink};font-weight:500">${v}</span></div>`;
  return `<style>${BASE}@page{size:${W}mm ${H}mm;margin:0}body{width:${W}mm}
.side{width:${W}mm;height:${H}mm;position:relative;overflow:hidden;page-break-after:always;break-after:page}</style>
<div class="side" style="background:${C.red}">
<div style="position:absolute;right:${bleed - 10}mm;top:${bleed - 13}mm;width:80mm;height:80mm">${svg("gati-glyph-white")}</div>
<div style="position:absolute;left:0;top:0;bottom:0;width:${bleed + 31}mm;background:${C.navy}"></div>
<div style="position:absolute;left:${p}mm;bottom:${p}mm;width:23mm">
<div style="width:13mm;height:${13 * 232 / 386}mm">${svg("gati-wordmark-white")}</div>
<div style="font:600 4.6pt Sora;letter-spacing:.42em;color:#C9D3DF;margin-top:1.3mm">GATI</div>
<div style="width:6mm;height:.45mm;border-radius:9px;background:${C.orange};margin:2.4mm 0 2mm"></div>
<div class="ne" style="font-weight:700;font-size:6.6pt;line-height:1.3;color:#fff">सही सूचना,<br>सही समयमा ।</div>
<div style="font-size:4.9pt;line-height:1.35;color:#C9D3DF;margin-top:.9mm">The right alert,<br>right on time.</div></div></div>
<div class="side" style="background:#fff">
<svg viewBox="0 0 400 400" style="position:absolute;right:${bleed - 14}mm;top:50%;width:62mm;height:62mm;transform:translateY(-50%)" fill="none" stroke="${C.red}" stroke-linecap="round" stroke-width="22" aria-hidden="true">
<path d="M150 150 A70 70 0 0 1 150 250" opacity=".09"/><path d="M215 95 A150 150 0 0 1 215 305" opacity=".065"/><path d="M280 40 A230 230 0 0 1 280 360" opacity=".04"/></svg>
<div style="position:absolute;left:${p}mm;top:${p}mm;right:${p}mm;bottom:${p}mm;display:flex;flex-direction:column;justify-content:space-between">
<div style="display:flex;justify-content:space-between;align-items:flex-start">
<div><div style="font:700 15pt/1 Sora;color:${C.navy};letter-spacing:-.03em;white-space:nowrap">Niraj Bhusal</div>
<div class="ne" style="font-size:7.8pt;font-weight:600;color:${C.slate};line-height:1.2;margin-top:1.2mm">निरज भुसाल</div>
<div style="font-size:6.1pt;color:${C.ink};margin-top:1.6mm">Creator and maintainer, <span class="ne" style="font-weight:700">गति</span> <b>Gati</b></div>
<div style="display:inline-flex;align-items:center;gap:1.3mm;margin-top:1.9mm;background:${C.navy};border-radius:9mm;padding:1mm 2.8mm 1mm 2.2mm;font:600 5.2pt Sora;color:#fff;white-space:nowrap"><span style="color:${C.orange};font-size:6.4pt;line-height:1">★</span><span><b style="font-weight:700">Top Open Source Project of the Year 2026</b> <span style="color:#C9D3DF">· GitHub Octoverse</span></span></div></div>
<div style="height:7mm;width:${7 * 1080 / 512}mm">${svg("gati-logo-horizontal")}</div></div>
<div style="display:flex;justify-content:space-between;align-items:flex-end">
<div style="display:flex;flex-direction:column;gap:${PHONE ? 0.5 : 0.8}mm;border-left:.45mm solid ${C.red};padding-left:2.4mm">${PHONE ? row("TEL", PHONE) : ""}${row("WEB", SITE)}${row("X", "x.com/nirajbhusal")}${row("IN", "linkedin.com/in/nirajbhusal")}${row("GIT", "github.com/nirajbhusal")}</div>
<div style="width:13mm;height:13mm;background:#fff;box-shadow:0 0 0 1.2mm #fff;position:relative">${qr}</div></div></div></div>`;
}

/* ---------- brand guidelines ---------- */
function guidelines() {
  const sw = (name, hex, use, fg = "#fff") => `<div class="sw"><div style="background:${hex};color:${fg}"><b>${name}</b><br><code>${hex}</code></div><p>${use}</p></div>`;
  const fig = (n, bg, cap, h = 26) => `<figure style="background:${bg}"><div style="height:${h}mm;display:flex;justify-content:center"><div style="height:${h}mm;aspect-ratio:${(svg(n).match(/viewBox="0 0 (\d+) (\d+)"/) || []).slice(1).join("/")}">${svg(n)}</div></div><figcaption style="color:${bg === C.navy ? "#C9D3DF" : C.slate}">${cap}</figcaption></figure>`;
  const page = (n, title, ne, body) => `<section class="pg"><header><span class="ne">${ne}</span><span>गति Gati · Brand guidelines</span></header><h2>${title}</h2>${body}<footer><span>${SITE}/about/#brand</span><span>${n}</span></footer></section>`;
  const css = `${BASE}@page{size:A4;margin:0}
body{color:${C.ink};font-size:10.2pt;line-height:1.5}
.pg{width:210mm;height:297mm;padding:20mm 20mm 18mm;position:relative;page-break-after:always;break-after:page;overflow:hidden}
.pg header{display:flex;justify-content:space-between;font-size:8pt;color:${C.slate};letter-spacing:.04em;border-bottom:.3mm solid ${C.mist};padding-bottom:3mm;margin-bottom:9mm}
.pg footer{position:absolute;left:20mm;right:20mm;bottom:11mm;display:flex;justify-content:space-between;font-size:8pt;color:${C.slate}}
h2{font-size:25pt;line-height:1.1;letter-spacing:-.02em;color:${C.navy};margin-bottom:6mm}
h3{font-size:11.5pt;color:${C.navy};margin:6.5mm 0 2mm}
p{margin:0 0 2.6mm;max-width:150mm}
ul{margin:0 0 2mm 4.5mm}li{margin-bottom:1.2mm}
code{font-family:"DejaVu Sans Mono",monospace;font-size:.86em}
.grid{display:grid;gap:4mm}.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}.g4{grid-template-columns:repeat(4,1fr)}.g5{grid-template-columns:repeat(5,1fr)}
figure{border:.3mm solid ${C.mist};border-radius:3mm;padding:6mm 5mm 3mm;text-align:center}
figcaption{font-size:8pt;margin-top:3mm}
.sw{border:.3mm solid ${C.mist};border-radius:2.5mm;overflow:hidden}.sw>div{padding:9mm 3mm 2.5mm;font-size:9pt;line-height:1.35}.sw p{font-size:7.8pt;color:${C.slate};padding:1.8mm 3mm;margin:0;line-height:1.35}
table{border-collapse:collapse;width:100%;font-size:9pt}td,th{text-align:left;padding:1.7mm 2mm;border-bottom:.25mm solid ${C.mist};vertical-align:top}th{color:${C.slate};font-weight:600;font-size:8pt;letter-spacing:.04em;text-transform:uppercase}
.do,.dont{border-radius:3mm;padding:5mm;border:.3mm solid ${C.mist}}.do b{color:${C.teal}}.dont b{color:${C.red}}
.big{font-family:Mukta;font-weight:700;font-size:40pt;line-height:1.05;color:${C.navy}}
.note{background:${C.snow};border-left:1.2mm solid ${C.red};padding:4mm 5mm;border-radius:0 2mm 2mm 0;max-width:none}`;
  const cover = `<section class="pg" style="background:${C.navy};color:#fff;padding:26mm 22mm">${motif("#fff", 0.07)}
<div style="height:34mm;width:${34 * 1080 / 512}mm;position:relative">${svg("gati-logo-horizontal-white")}</div>
<div style="position:absolute;left:22mm;right:22mm;bottom:30mm">
<div style="width:16mm;height:1mm;border-radius:9px;background:${C.orange};margin-bottom:8mm"></div>
<div style="font-size:38pt;font-weight:700;letter-spacing:-.025em;line-height:1.05">Brand guidelines</div>
<div class="ne" style="font-size:20pt;font-weight:600;color:#C9D3DF;margin-top:2mm">ब्रान्ड निर्देशिका</div>
<div class="ne" style="font-size:13pt;font-weight:700;margin-top:14mm">सही सूचना, सही समयमा ।</div>
<div style="font-size:10.5pt;color:#C9D3DF">The right alert, right on time.</div>
<div style="font-size:8.5pt;color:#8F9BB3;margin-top:14mm">Version 1.0 · November 2026 · ${SITE}</div></div></section>`;
  const pages = [
    page(2, "What Gati is", "परिचय", `
<p style="font-size:13pt;line-height:1.45;color:${C.navy};max-width:160mm">Gati is an independent citizen project that relays Nepal's official disaster alerts, with source and time. It is Nepali first, free, open source, and needs no account.</p>
<p class="note"><b>Gati never issues official warnings.</b> It carries the words of agencies such as DHM, NDRRMA and NEOC to more people, faster. Everything in this guide follows from that: the brand should look calm, clear and trustworthy, and should never look like a government body.</p>
<h3>Name</h3>
<div class="grid g2"><div><div class="big">गति</div><p>The name. It means speed, motion: the right information should arrive fast.</p></div>
<div><div class="big" style="font-family:Inter;letter-spacing:-.03em">Gati</div><p>In English, capital G only. Never “GATI” in running text. Together, Nepali comes first: <b><span class="ne">गति</span> Gati</b>.</p></div></div>
<h3>Tagline</h3>
<p><span class="ne" style="font-weight:700;font-size:13pt">सही सूचना, सही समयमा ।</span><br>The right alert, right on time.</p>
<h3>Short description</h3>
<p><span class="ne">“नेपालका आधिकारिक विपद् सूचना, स्रोत र समयसहित, फैलाउने स्वतन्त्र नागरिक परियोजना।”</span><br>“An independent citizen project that relays Nepal's official disaster alerts, with source and time.”</p>
<h3>How to credit an alert</h3>
<p>Never write “Gati warned”. Write “DHM's warning, relayed by Gati”.</p>
<h3>Recognition</h3>
<p>Gati was featured in GitHub's Octoverse 2026 report (28 October 2026). Say “Featured in GitHub Octoverse 2026”. It is a mention, not an award or an endorsement, and Gati is not affiliated with GitHub.</p>`),
    page(3, "Logo", "लोगो", `
<p>The mark is a white “<span class="ne">ग</span>”, the first letter of <span class="ne">गति</span>, on a red rounded square, with three signal arcs spreading to the right. The arcs stand for a message being relayed, and fade as they travel.</p>
<div class="grid g2" style="margin-top:5mm">${fig("gati-logo-horizontal", C.snow, "Horizontal logo. First choice on light backgrounds.")}${fig("gati-logo-horizontal-white", C.navy, "Horizontal logo, white. For dark backgrounds.")}</div>
<div class="grid g4" style="margin-top:4mm">${fig("gati-mark", C.snow, "Mark", 22)}${fig("gati-logo-stacked", C.snow, "Stacked", 22)}${fig("gati-glyph-navy", C.snow, "One colour", 22)}${fig("gati-glyph-white", C.navy, "One colour, white", 22)}</div>
<h3>Clear space</h3>
<div class="grid g2"><div><div style="display:inline-block;border:.3mm dashed ${C.red};padding:6mm;background:${C.snow}"><div style="width:24mm;height:24mm">${svg("gati-mark")}</div></div></div>
<div><p>Keep at least a quarter of the mark's height empty on every side. Nothing else goes inside that space: no text, no other logo, no edge of the page.</p></div></div>
<h3>Minimum size</h3>
<table><tr><th>Version</th><th>Screen</th><th>Print</th></tr><tr><td>Mark</td><td>24 px</td><td>8 mm</td></tr><tr><td>Horizontal logo</td><td>96 px wide</td><td>28 mm wide</td></tr><tr><td>Stacked logo</td><td>64 px wide</td><td>18 mm wide</td></tr></table>
<p style="margin-top:3mm">Below these sizes use the mark alone. At 32 px and below (favicon) the letter appears without the arcs.</p>`),
    page(4, "Colour", "रङ", `
<h3 style="margin-top:0">Brand colours</h3>
<div class="grid g5">${sw("Gati Red", C.red, "Logo, app icon")}${sw("Navy", C.navy, "Wordmark, dark surfaces")}${sw("Crimson", C.crimson, "Interface accent")}${sw("River Teal", C.teal, "Links, secondary accent")}${sw("Glacier", C.glacier, "Links on dark", C.ink)}</div>
<h3>Neutrals</h3>
<div class="grid g4">${sw("Snow", C.snow, "Page background", C.ink)}${sw("Mist", C.mist, "Borders, dividers", C.ink)}${sw("Slate", C.slate, "Secondary text")}${sw("Ink", C.ink, "Body text")}</div>
<h3>Severity colours (CAP)</h3>
<div class="grid g5">${sw("Extreme", "#8E1B14", "अत्यन्त गम्भीर")}${sw("Severe", "#D93025", "गम्भीर")}${sw("Moderate", "#F28C1E", "मध्यम", C.ink)}${sw("Minor", "#F2C94C", "सामान्य", C.ink)}${sw("Info", "#8F9BB3", "सूचना", C.ink)}</div>
<p class="note" style="margin-top:5mm">Severity colours are reserved for alert severity. Never use them as decoration, and always show them with a word and an icon, so the meaning does not depend on colour alone.</p>
<h3>Using colour</h3>
<ul><li>Most of any layout is neutral: Snow or white with Ink text, or Navy with white text.</li><li>Gati Red belongs to the logo. Use it sparingly elsewhere, so it is never mistaken for a Severe alert.</li><li>Body text must reach a contrast of 4.5:1 against its background.</li><li>The site has three themes (paper, light, dark). The paper theme uses a very light warm background, <code>#FCF6F4</code>.</li></ul>`),
    page(5, "Typography", "अक्षर", `
<div class="grid g2"><div><div class="big">अ आ क ख ग</div><h3 style="margin-top:2mm">Mukta</h3><p>Devanagari text and headings. Weights 400, 600 and 700.</p><p class="ne" style="font-size:12pt">नेपालका आधिकारिक विपद् सूचना, स्रोत र समयसहित।</p></div>
<div><div class="big" style="font-family:Inter;letter-spacing:-.03em">Aa Bb 0123</div><h3 style="margin-top:2mm">Inter</h3><p>Latin text and numerals. Weights 400, 500, 600 and 700.</p><p style="font-size:12pt">Nepal's official disaster alerts, with source and time.</p></div></div>
<p style="margin-top:3mm">Both are open fonts under the SIL Open Font License and are served from the Gati site itself, never from a third party.</p>
<h3>Scale</h3>
<table><tr><th>Role</th><th>Size</th><th>Weight</th><th>Notes</th></tr><tr><td>Page title</td><td>28 to 32 px</td><td>700</td><td>One per page</td></tr><tr><td>Section heading</td><td>20 to 22 px</td><td>700</td><td></td></tr><tr><td>Alert headline</td><td>18 to 20 px</td><td>600 to 700</td><td>The agency's own wording</td></tr><tr><td>Body</td><td>16 to 17 px</td><td>400</td><td>Line height 1.6 for Devanagari</td></tr><tr><td>Label, source, time</td><td>13 to 14 px</td><td>500 to 600</td><td>Slate</td></tr></table>
<h3>Rules</h3>
<ul><li>Nepali comes first wherever both languages appear.</li><li>Numerals follow the language: <span class="ne">०१२३</span> in Nepali, 0123 in English.</li><li>Give Devanagari more line height than Latin, so the top line and the matras do not collide.</li><li>Do not letter-space Devanagari. Spaced capitals are only for short Latin labels such as “GATI” in the logo.</li><li>No italics for Devanagari. Use weight for emphasis.</li></ul>`),
    page(6, "Voice and writing", "बोली र लेखाइ", `
<p style="font-size:13pt;color:${C.navy}">Gati sounds like a calm, careful neighbour who has read the official notice and is telling you exactly what it says.</p>
<ul><li>Nepali first. Address the reader respectfully (<span class="ne">हजुर</span>).</li><li>Short sentences and plain words. No alarming or sensational wording.</li><li>Every item carries its source and the source time.</li><li>Do not reword an official notice. When summarising, label it as a summary.</li><li>Never add together figures from different agencies.</li><li>Show the trust label (Official, Verified, Reported) and the severity separately, always.</li><li>Say plainly what Gati does not know, and when information is old.</li></ul>
<h3>Examples</h3>
<table><tr><th>Write</th><th>Not</th></tr>
<tr><td>DHM's warning, relayed by Gati</td><td>Gati warns of floods</td></tr>
<tr><td><span class="ne">स्रोत: जल तथा मौसम विज्ञान विभाग, बिहान ६:३०</span></td><td><span class="ne">ताजा खबर!</span></td></tr>
<tr><td>Summary, not word for word</td><td>(an unlabelled rewrite)</td></tr>
<tr><td>Model, not a warning</td><td>Rain alert for the next 3 hours</td></tr>
<tr><td>Featured in GitHub Octoverse 2026</td><td>Award-winning, GitHub-backed</td></tr></table>
<h3>Design language in brief</h3>
<ul><li><b>Quiet until it matters.</b> Neutral pages, so that a severity colour is always noticed.</li><li><b>Source and time on everything.</b> No alert, number or map layer appears without them.</li><li><b>Works on a weak phone and a weak signal.</b> Plain pages, small files, usable offline.</li><li><b>Never by colour alone.</b> Severity is a word, an icon and a colour together.</li><li><b>Rounded, not playful.</b> Corner radius 10 to 14 px on cards, full pills for labels, no drop shadows on the logo.</li></ul>`),
    page(7, "Icons and social media", "आइकन र सामाजिक सञ्जाल", `
<div class="grid g4">${fig("gati-mark", C.snow, "App icon", 20)}${fig("gati-mark-square", C.snow, "Maskable / full bleed", 20)}<figure style="background:${C.snow}"><div style="height:20mm;display:flex;justify-content:center"><div style="width:20mm;height:20mm;border-radius:50%;overflow:hidden;background:${C.red};display:flex;align-items:center;justify-content:center"><div style="width:14mm;height:14mm;margin-left:.7mm">${svg("gati-glyph-white")}</div></div></div><figcaption style="color:${C.slate}">Profile picture</figcaption></figure>${fig("gati-mark-navy", C.snow, "Navy alternative", 20)}</div>
<p style="margin-top:4mm">Profile pictures are full-bleed Gati Red with the white glyph kept inside the circle that every platform crops to. Theme colour <code>#0B1424</code>; app launch background <code>#F7F9FB</code>.</p>
<h3>Sizes in the kit</h3>
<table><tr><th>Use</th><th>Size (px)</th><th>File</th></tr>
<tr><td>X header</td><td>1500 × 500</td><td>covers/x-header</td></tr>
<tr><td>LinkedIn page cover</td><td>1128 × 191</td><td>covers/linkedin-page-cover</td></tr>
<tr><td>LinkedIn profile banner</td><td>1584 × 396</td><td>covers/linkedin-profile-banner</td></tr>
<tr><td>Facebook cover</td><td>1640 × 624</td><td>covers/facebook-cover</td></tr>
<tr><td>YouTube banner</td><td>2560 × 1440</td><td>covers/youtube-banner</td></tr>
<tr><td>GitHub social preview</td><td>1280 × 640</td><td>covers/github-social-preview</td></tr>
<tr><td>Telegram / Viber cover</td><td>1280 × 720</td><td>covers/telegram-viber-cover</td></tr>
<tr><td>Link share image</td><td>1200 × 630</td><td>covers/share-cover</td></tr>
<tr><td>YouTube thumbnail</td><td>1280 × 720</td><td>thumbnails/youtube-thumbnail</td></tr>
<tr><td>Square and portrait post</td><td>1080 × 1080, 1080 × 1350</td><td>posts/post-square, post-portrait</td></tr>
<tr><td>Story, Reel, TikTok</td><td>1080 × 1920</td><td>posts/story</td></tr>
<tr><td>Profile pictures</td><td>400 to 1080</td><td>profile/ (one per platform)</td></tr></table>
<p style="margin-top:3mm">Banners keep the logo and tagline inside each platform's safe area, so they survive cropping on phones.</p>`),
    page(8, "Do and don't", "गर्ने र नगर्ने", `
<div class="grid g2"><div class="do"><b>✓ Do</b><ul style="margin-top:2mm"><li>Use the logo unchanged in news, articles and talks about Gati.</li><li>When showing a Gati alert, also show the original agency's name and link.</li><li>Link to the Gati site or to the specific alert.</li><li>Use the white logo on dark backgrounds and the standard logo on light ones.</li></ul></div>
<div class="dont"><b>✕ Don't</b><ul style="margin-top:2mm"><li>Recolour, stretch, rotate, or add shadows or effects to the logo.</li><li>Combine it with a government emblem or agency logo, or present Gati as official.</li><li>Suggest that Gati endorses or sponsors anyone.</li><li>Use the Gati name and logo on a fork or another service; use your own.</li><li>Place the logo over photos or busy backgrounds.</li></ul></div></div>
<div class="grid g4" style="margin-top:6mm">
<figure style="background:${C.snow}"><div style="height:18mm;display:flex;justify-content:center"><div style="width:18mm;height:18mm;transform:scaleX(1.5)">${svg("gati-mark")}</div></div><figcaption style="color:${C.red}">✕ Stretched</figcaption></figure>
<figure style="background:${C.snow}"><div style="height:18mm;display:flex;justify-content:center"><div style="width:18mm;height:18mm;filter:hue-rotate(200deg)">${svg("gati-mark")}</div></div><figcaption style="color:${C.red}">✕ Recoloured</figcaption></figure>
<figure style="background:${C.snow}"><div style="height:18mm;display:flex;justify-content:center"><div style="width:18mm;height:18mm;transform:rotate(-18deg)">${svg("gati-mark")}</div></div><figcaption style="color:${C.red}">✕ Rotated</figcaption></figure>
<figure style="background:${C.snow}"><div style="height:18mm;display:flex;justify-content:center"><div style="width:18mm;height:18mm;filter:drop-shadow(1.5mm 1.5mm 1.5mm rgba(0,0,0,.55))">${svg("gati-mark")}</div></div><figcaption style="color:${C.red}">✕ Shadow or effect</figcaption></figure></div>
<h3>Licence</h3>
<p>Gati's code (MIT) and content (CC BY 4.0) are openly licensed, but the name and logo identify this project and are not covered by those licences. “Gati” is a working name pending a trademark check.</p>
<h3>Files</h3>
<p>The full kit, with vector (SVG) and PNG logos, icons, social media images and this guide, is on the About page:<br><b>${SITE}/about/#brand</b></p>
<h3>Contact</h3>
<p>Gati is built and maintained by Niraj Bhusal as an independent citizen project.<br>x.com/nirajbhusal · linkedin.com/in/nirajbhusal<br>${SITE}/contact/</p>`),
  ];
  return `<style>${css}</style>${cover}${pages.join("")}`;
}

(async () => {
  const browser = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {});
  const page = await browser.newPage();
  let n = 0;
  const load = async (html) => { const f = path.join(TMP, "p" + (n++) + ".html"); fs.writeFileSync(f, "<!doctype html><meta charset=utf-8>" + html); await page.goto("file://" + f); await page.evaluate(() => document.fonts.ready); };
  const png = async (rel, html, w, h, transparent) => { await page.setViewportSize({ width: w, height: h }); await load(html); await page.screenshot({ path: path.join(OUT, rel + ".png"), omitBackground: !!transparent, clip: { x: 0, y: 0, width: w, height: h } }); };
  ["logos/png", "icons", "social/profile", "social/covers", "social/thumbnails", "social/posts", "print"].forEach(mk);

  /* logos as PNG */
  for (const f of fs.readdirSync(LOGOS).filter((x) => x.endsWith(".svg"))) {
    const name = f.slice(0, -4), vb = fs.readFileSync(path.join(LOGOS, f), "utf8").match(/viewBox="0 0 (\d+) (\d+)"/);
    const big = /logo-horizontal/.test(name) ? 2400 : /wordmark/.test(name) ? 1600 : 1024;
    const h = Math.round(big * vb[2] / vb[1]);
    await png("logos/png/" + name, `<style>${BASE}body{width:${big}px;height:${h}px}</style>${svg(name)}`, big, h, true);
  }
  /* app and web icons */
  for (const s of [180, 192, 512, 1024]) await png(`icons/app-icon-${s}`, plain("gati-mark", s), s, s, true);
  await png("icons/app-icon-maskable-512", profile(512, C.red), 512, 512);
  await png("icons/apple-touch-icon-180", plain("gati-mark-square", 180), 180, 180);
  for (const s of [16, 32, 48, 64]) await png(`icons/favicon-${s}`, `<style>${BASE}body{width:${s}px;height:${s}px;background:${C.red};border-radius:${s * 0.22}px;display:flex;align-items:center;justify-content:center;color:#fff;font:700 ${s * 0.78}px/1 Mukta;overflow:hidden}span{margin-top:${s * 0.13}px}</style><span>ग</span>`, s, s, true);
  /* profile pictures */
  for (const [who, s] of PROFILES) await png(`social/profile/${who}-profile-${s}`, profile(s, C.red), s, s);
  await png("social/profile/profile-navy-1080", profile(1080, C.navy), 1080, 1080);
  await png("social/profile/profile-red-1080", profile(1080, C.red), 1080, 1080);
  /* covers, thumbnails, posts */
  for (const [rel, o] of SOCIAL) await png(rel, banner(o), o.w, o.h);

  /* guidelines */
  await load(guidelines());
  await page.pdf({ path: path.join(OUT, "print/gati-brand-guidelines.pdf"), preferCSSPageSize: true, printBackground: true });
  /* visiting card: trim size, print size with 3 mm bleed, and previews */
  for (const [fn, bleed, name] of [[card, 0, "niraj-bhusal-visiting-card"], [card, 3, "niraj-bhusal-visiting-card-print-3mm-bleed"]]) {
    await load(fn(bleed));
    await page.pdf({ path: path.join(OUT, "print/" + name + ".pdf"), preferCSSPageSize: true, printBackground: true });
  }
  const cp = await browser.newPage({ viewport: { width: 1063, height: 1100 }, deviceScaleFactor: 1 });
  for (const [fn, name] of [[card, "niraj-bhusal-visiting-card"]]) {
    const f = path.join(TMP, name + ".html");
    fs.writeFileSync(f, "<!doctype html><meta charset=utf-8><style>html{zoom:3.125}</style>" + fn(0)); // 90 mm -> 1063 px
    await cp.goto("file://" + f); await cp.evaluate(() => document.fonts.ready);
    const sides = await cp.$$(".side");
    await sides[0].screenshot({ path: path.join(OUT, "print/" + name + "-front.png") });
    await sides[1].screenshot({ path: path.join(OUT, "print/" + name + "-back.png") });
  }
  await browser.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log("rendered brand files into assets/brand");
})().catch((e) => { console.error(e); process.exit(1); });
