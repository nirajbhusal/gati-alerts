/* Public list of citizen reports: ONLY issues a moderator labelled "verified" are shown.
   Unverified reports are never listed here; we show only how many are still pending. Read-only, unauthenticated API. */
(async function () {
  const G = window.Gati, el = document.getElementById("list"), pend = document.getElementById("pending");
  const REPO = "nirajbhusal/gati-alerts";
  let items = [], failed = false, pending = null;
  try {
    items = (await G.gh(`https://api.github.com/repos/${REPO}/issues?state=all&per_page=50&labels=verified`, { headers: { Accept: "application/vnd.github+json" } })).filter((i) => !i.pull_request && !i.labels.some((l) => l.name.toLowerCase() === "retracted"))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  } catch (e) { failed = true; }
  try {
    const q = encodeURIComponent(`repo:${REPO} is:issue is:open label:reported -label:verified -label:retracted`);
    pending = (await G.gh(`https://api.github.com/search/issues?per_page=1&q=${q}`)).total_count;
  } catch (e) { /* count is optional */ }
  const parse = (body) => {
    const o = {}; (body || "").split(/^### /m).slice(1).forEach((s) => {
      const nl = s.indexOf("\n"); const k = s.slice(0, nl).trim(); let v = s.slice(nl + 1).trim();
      if (v === "_No response_") v = ""; o[k] = v; });
    return o;
  };
  const pick = (o, start) => { const k = Object.keys(o).find((k) => k.startsWith(start)); return k ? o[k] : ""; };
  // Defence in depth: never display contact details even if someone typed them into the public text.
  const scrub = (s) => String(s || "").replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email hidden]").replace(/(\+?977[-\s]?)?\b9[678]\d{8}\b/g, "[phone hidden]")
    .replace(/\b\d[\d\s-]{8,}\d\b/g, "[number hidden]").replace(/!\[[^\]]*\]\([^)]*\)|<img[^>]*>/g, "[photo on GitHub]");
  const status = (labels) => {
    const n = labels.map((l) => l.name.toLowerCase());
    for (const s of ["retracted", "corrected", "verified"]) if (n.includes(s)) return s[0].toUpperCase() + s.slice(1);
    return "Reported";
  };
  function render() {
    if (pend) pend.innerHTML = pending === null ? "" : (G.lang === "ne"
      ? `<strong>${G.num(pending)}</strong> रिपोर्ट मोडेरेटरले जाँच्न बाँकी छन्। जाँच नसकिएसम्म ती यहाँ देखाइँदैनन्।`
      : `<strong>${pending}</strong> report${pending === 1 ? " is" : "s are"} waiting for a moderator to check. They are not shown here until checked.`);
    if (failed) { el.innerHTML = `<div class="empty">${G.lang === "ne" ? "GitHub बाट रिपोर्ट ल्याउन सकिएन (सायद API को सीमा नाघ्यो)। केही बेरपछि फेरि हेर्नुहोस्, नत्र" : "Could not load reports from GitHub (possibly the API rate limit). Try again later or"} <a href="https://github.com/nirajbhusal/gati-alerts/issues?q=label%3Averified">GitHub ${G.lang === "ne" ? "मा हेर्नुहोस्" : "issues"}</a>.</div>`; return; }
    if (!items.length) { el.innerHTML = `<div class="empty">${G.lang === "ne" ? "अहिलेसम्म मोडेरेटरले जाँचेको कुनै नागरिक रिपोर्ट छैन।" : "No verified citizen reports yet."}</div>`; return; }
    el.innerHTML = items.map((i) => {
      const o = parse(i.body), st = status(i.labels);
      const gps = pick(o, "GPS"), m = gps.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
      const where = [pick(o, "ठाउँ"), pick(o, "नगर"), pick(o, "वडा") && (G.lang === "ne" ? "वडा " : "Ward ") + pick(o, "वडा"), pick(o, "जिल्ला")].filter(Boolean).map(scrub).join(", ");
      const warn = st === "Verified" ? "" : `<p class="meta"><strong>${st === "Retracted" ? (G.lang === "ne" ? "फिर्ता लिइएको — गलत/भ्रामक" : "Retracted — false or misleading") : "रिपोर्ट गरिएको — पुष्टि भएको छैन"}</strong>${G.lang === "en" && st !== "Retracted" ? " · Reported — not confirmed" : ""}</p>`;
      return `<article class="card alert s-Unknown">
        <div class="chips">${G.trustChip(st)}${st === "Verified" ? "" : G.trustChip("Reported")}<span class="tag">${G.esc(scrub(pick(o, "जोखिम")).split(" / ")[G.lang === "ne" ? 0 : 1] || "")}</span></div>
        <h3>${G.esc(scrub(i.title.replace(/^\[Report\]\s*/, "")))}</h3>${warn}
        <p class="meta">📍 ${G.esc(where)}${m ? ` · <a href="https://www.openstreetmap.org/?mlat=${+m[1]}&mlon=${+m[2]}#map=14/${+m[1]}/${+m[2]}" rel="noopener">${G.lang === "ne" ? "नक्सा" : "map"} ↗</a>` : ""}</p>
        <p class="meta">🕒 ${G.lang === "ne" ? "देखेको" : "Observed"}: ${G.esc(pick(o, "देखेको").slice(0, 40))} · ${G.lang === "ne" ? "पठाएको" : "Sent"}: ${G.npt(i.created_at)}</p>
        <p>${G.esc(scrub(pick(o, "के देख्नुभयो")).slice(0, 600))}</p>
        <p class="meta"><a href="${G.esc(i.html_url)}" rel="noopener">GitHub #${i.number} ↗</a></p></article>`;
    }).join("");
  }
  render(); G.onLang(render);
})();
