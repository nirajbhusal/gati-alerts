/* Regional interface languages (Maithili, Bhojpuri, ...) layered over Nepali.
   How it works: the page stays in Nepali; short interface strings that have a translation in data/i18n/<code>.json
   are swapped in place. Anything without a translation stays in Nepali. Official alert text is never translated.
   The choice is kept in this browser only (gati-locale). Loaded by common.js. See docs/LANGUAGES.md. */
(async function () {
  const G = window.Gati; if (!G || G.localeReady) return; G.localeReady = true;
  const KEY = "gati-locale", get = () => { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } };
  let index = null; try { index = await fetch(G.root + "data/i18n/index.json").then((r) => r.json()); } catch (e) {}
  const langs = ((index && index.languages) || []).filter((l) => l.status === "draft" || l.status === "reviewed");
  let code = get(); if (!langs.some((l) => l.code === code)) code = "";

  /* ---- picker on the Profile & Settings page ---- */
  const T = (ne, en) => (G.lang === "ne" ? ne : en);
  G.localePicker = (box) => {
    if (!box || !langs.length) return;
    box.innerHTML = `<h3>${T("स्थानीय भाषा (परीक्षण)", "Regional language (beta)")}</h3>
      <select id="locsel" aria-label="${T("स्थानीय भाषा", "Regional language")}"><option value="">${T("नेपाली मात्र", "Nepali only")}</option>${langs.map((l) => `<option value="${l.code}"${l.code === code ? " selected" : ""}>${G.esc(l.name)} · ${G.esc(l.nameEn)}${l.status === "draft" ? " (beta)" : ""}</option>`).join("")}</select>
      <p class="meta">${T("मेनु र बटन जस्ता छोटा शब्द मात्र बदलिन्छन्; बाँकी नेपालीमै रहन्छ। आधिकारिक सूचनाको शब्द कहिल्यै बदलिँदैन। अनुवाद जाँच हुँदै छ; गल्ती देख्नुभए खबर गर्नुहोस्।",
        "Only short words such as menus and buttons change; the rest stays in Nepali. The wording of official notices is never changed. Translations are still being checked; please report mistakes.")}</p>`;
    box.querySelector("#locsel").onchange = (e) => { try { e.target.value ? localStorage.setItem(KEY, e.target.value) : localStorage.removeItem(KEY); } catch (x) {} location.reload(); };
  };
  /* ---- language row on the home page: Nepali, English, and the regional languages ---- */
  G.localeBar = (box) => {
    if (!box) return;
    const cur = G.lang === "en" ? "en" : (code || "ne");
    const opts = [["ne", "नेपाली", ""], ["en", "English", ""], ...langs.map((l) => [l.code, l.name, l.status === "draft" ? " β" : ""])];
    box.innerHTML = `<span class="hlang-l" aria-hidden="true">🌐</span>` + opts.map(([c, n, tag]) => `<button type="button" data-l="${c}" aria-pressed="${c === cur}"${tag ? ` title="${T("परीक्षण: अनुवाद जाँच हुँदै छ", "Beta: translation still being checked")}"` : ""}>${G.esc(n)}${tag}</button>`).join("");
    box.querySelectorAll("button").forEach((b) => (b.onclick = () => { const c = b.dataset.l;
      if (c === "en") return G.setLang("en");                                     /* a saved regional choice is kept for next time */
      const want = c === "ne" ? "" : c;
      try { want ? localStorage.setItem(KEY, want) : localStorage.removeItem(KEY); } catch (x) {}
      if (want === code) return G.setLang("ne");
      try { localStorage.setItem("gati-lang", "ne"); } catch (x) {} location.reload(); }));
  };
  const bar = () => G.localeBar(document.getElementById("home-lang"));
  bar(); G.onLang && G.onLang(() => setTimeout(bar, 0));
  const mount = () => G.localePicker(document.getElementById("me-locale"));
  mount(); G.onLang && G.onLang(() => setTimeout(mount, 0));
  if (document.body.dataset.page === "me") new MutationObserver(() => { const b = document.getElementById("me-locale"); if (b && !b.firstChild) mount(); }).observe(document.body, { childList: true, subtree: true });

  /* ---- overlay ---- */
  if (!code) return;
  let dict = null; try { dict = (await fetch(G.root + "data/i18n/" + code + ".json").then((r) => r.json())).strings; } catch (e) {}
  if (!dict) return;
  document.documentElement.dataset.locale = code;
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, CODE: 1, PRE: 1 };
  const orig = new WeakMap();
  const swap = (n) => {
    const p = n.parentElement; if (!p || SKIP[p.tagName] || p.closest("#me-locale,#home-lang,[data-official],.en-only")) return;
    const raw = orig.has(n) ? orig.get(n) : n.nodeValue, k = raw.trim(); if (!k) return;
    const want = G.lang === "ne" && dict[k] ? raw.replace(k, dict[k]) : raw;
    if (n.nodeValue !== want) { if (!orig.has(n)) orig.set(n, raw); n.nodeValue = want; }
  };
  const walk = (root) => { if (root.nodeType === 3) return swap(root); if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) swap(n); };
  let busy = false;
  const mo = new MutationObserver((ms) => { if (busy) return; busy = true;
    for (const m of ms) { if (m.type === "characterData") { orig.delete(m.target); swap(m.target); } else m.addedNodes.forEach(walk); }
    mo.takeRecords(); busy = false; });
  walk(document.body); mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  G.onLang && G.onLang(() => setTimeout(() => { busy = true; walk(document.body); mo.takeRecords(); busy = false; }, 0));
})();
