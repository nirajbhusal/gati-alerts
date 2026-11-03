/* Emergency numbers: search (Nepali, English, romanized, number), category chips, district filter, tap-to-call, copy.
   Gati relays numbers as listed by the source; every row carries its source link and source time. */
(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc;
  const C = await G.json("data/contacts.json"), D = await G.json("data/districts.json").catch(() => []);
  const $ = (id) => document.getElementById(id), q = $("csearch");
  const PIN = ["100", "101", "102", "1234"];
  const CAT = { police: ["प्रहरी", "Police"], apf: ["सशस्त्र प्रहरी", "APF"], army: ["सेना", "Army"], ambulance: ["एम्बुलेन्स", "Ambulance"], fire: ["दमकल", "Fire"], hospital: ["स्वास्थ्य", "Health"], ndrrma: ["विपद् / DEOC", "Disaster / DEOC"], dao: ["जिल्ला प्रशासन", "District administration"], local: ["स्थानीय तह", "Local level"], relief: ["राहत गोदाम", "Relief warehouse"], helpline: ["हेल्पलाइन", "Helpline"] };
  const dById = Object.fromEntries(D.map((d) => [d.id, d])), dByCode = Object.fromEntries(D.map((d) => [d.code, d]));
  /* flat list: national first (district ""), then district rows */
  const ALL = C.national.map((x) => ({ ...x, district: "", agency_ne: x.agency_ne || x.ne, agency_en: x.agency_en || x.agency || x.en, trust: /rasuwa-flood-bulletin/.test(x.src) ? "Reported" : "Official" }))
    .concat(...Object.values(C.districts || {}).map((a) => a.map((x) => ({ ...x, trust: "Reported" }))));
  /* romanized-tolerant matching: Devanagari to rough Latin, then a consonant skeleton (aspirates, b/v/w, s/sh, doubled letters, vowels folded) */
  const DV = { "अ": "a", "आ": "a", "इ": "i", "ई": "i", "उ": "u", "ऊ": "u", "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng", "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n", "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n", "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n", "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m", "य": "y", "र": "r", "ल": "l", "व": "b", "श": "s", "ष": "s", "स": "s", "ह": "h", "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u", "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ं": "n", "ँ": "n", "ः": "" };
  const DIG = "०१२३४५६७८९";
  const ascii = (s) => String(s).replace(/[०-९]/g, (d) => DIG.indexOf(d));
  const lat = (s) => ascii(s).replace(/[\u0900-\u097F]/g, (c) => (c in DV ? DV[c] : "")).toLowerCase();
  const skel = (s) => lat(s).replace(/[^a-z0-9 ]/g, "").replace(/([kgcjtdpb])h/g, "$1").replace(/[vw]/g, "b").replace(/sh/g, "s").replace(/ph|f/g, "p").replace(/z/g, "j").replace(/\B[aeiouy]+/g, "").replace(/[nm](?=[kgcjtdpbsl])/g, "").replace(/(.)\1+/g, "$1").replace(/\s+/g, " ").trim();
  const digits = (s) => ascii(s).replace(/\D/g, "");
  ALL.forEach((x) => {
    const d = dById[x.district] || {}, c = CAT[x.cat] || ["", ""];
    const words = [x.ne, x.en, x.role_ne, x.role_en, x.agency_ne, x.agency_en, x.note_en, d.ne, d.en, c[0], c[1], x.cat].filter(Boolean).join(" ");
    x._t = lat(words); x._s = skel(words); x._n = x.num;
  });
  const P = new URLSearchParams(location.search);
  let cat = P.get("cat") || "", dist = P.get("d");
  if (dist == null) { const my = dByCode[G.district.get()]; dist = my && C.districts[my.id] ? my.id : ""; }
  q.value = P.get("s") || "";
  const match = (x, s) => {
    if (!s) return true;
    const n = digits(s);
    if (n.length >= 2 && n.length === ascii(s).replace(/[\s+-]/g, "").length) return x._n.includes(n.replace(/^977/, ""));
    const l = lat(s).trim(), k = skel(s);
    if (l.split(/\s+/).every((w) => x._t.includes(w))) return true;
    if (/[\u0900-\u097F]/.test(s)) return false; /* Nepali script: exact form only */
    const ks = k.split(" ").filter((w) => w.length >= 3); return ks.length > 0 && ks.every((w) => x._s.split(" ").some((t) => t.startsWith(w) || (w.length >= 4 && t.includes(w))));
  };
  const CI = {};
  const IC = { phone: '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>', copy: '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>' };
  const stime = (x) => (x.source_time_ne ? T(x.source_time_ne, x.source_time_en) : (x.checked || C.checked) ? T("जाँच", "checked") + " " + G.num(x.checked || C.checked) : "");
  const sn = (n) => { const a = String(n || "").split(" · "); return a.length === 2 && /[\u0900-\u097F]/.test(a[0]) ? T(a[0], a[1]) : n || ""; };
  const row = (x) => {
    const tel = x.tel || x.num, c = CAT[x.cat] || ["", ""], sub = [x.role_ne ? T(x.role_ne, x.role_en) : "", x.district || x.agency_ne !== x.ne ? T(x.agency_ne, x.agency_en) : ""].filter(Boolean).join(" · ");
    return `<li class="crow${PIN.includes(x.num) && !x.district ? " key" : ""}">
      <div class="cinfo"><p class="cname">${esc(T(x.ne, x.en))} <span class="ccat">${esc(T(c[0], c[1]))}</span></p>${sub ? `<p class="csub">${esc(sub)}</p>` : ""}${x.note_ne ? `<p class="csub">${esc(T(x.note_ne, x.note_en))}</p>` : ""}
      <p class="csrc">${G.trustChip(x.trust)} ${T("स्रोत", "Source")}: <a href="${esc(x.src)}" target="_blank" rel="noopener">${esc(sn(x.srcName))}</a>${x.src2 ? ` · <a href="${esc(x.src2)}" target="_blank" rel="noopener">${esc(x.src2Name)}</a>` : ""}${stime(x) ? " · " + esc(stime(x)) : ""}</p></div>
      <div class="cact"><a class="ccall cbtn" href="tel:${esc(tel)}" aria-label="${esc(T("फोन गर्नुहोस्", "Call"))} ${esc(x.num)}, ${esc(T(x.ne, x.en))}">${IC.phone}<span>${G.num(x.num)}</span></a><button type="button" class="ccopy" data-n="${esc(x.num)}" aria-label="${esc(T("नम्बर कपी गर्नुहोस्", "Copy number"))} ${esc(x.num)}" title="${esc(T("कपी", "Copy"))}">${IC.copy}</button></div></li>`;
  };
  const RM = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hdr = () => { const h = document.querySelector("header.top"); return h ? Math.max(0, h.getBoundingClientRect().bottom) : 0; };
  /* after a chip tap: keep the chip fully visible inside its row (row-relative, not page offsetLeft), then bring the results heading
     just below the sticky header if it is off screen. One scroll each, smooth unless reduced motion. */
  function reveal(b) {
    const row = $("cchips"), rr = row.getBoundingClientRect(), br = b.getBoundingClientRect(), pad = 16;
    let dx = 0; if (br.left < rr.left + pad) dx = br.left - rr.left - pad; else if (br.right > rr.right - pad) dx = br.right - rr.right + pad;
    if (dx) row.scrollBy({ left: dx, behavior: RM() ? "auto" : "smooth" });
    const tgt = $("ccount"), top = tgt.getBoundingClientRect().top, h = hdr() + 8;
    if (top < h || top > innerHeight * 0.7) scrollTo({ top: scrollY + top - h - row.offsetHeight - 8, behavior: RM() ? "auto" : "smooth" });
  }
  function draw() {
    q.placeholder = T("नाम, ठाउँ वा नम्बर खोज्नुहोस् (जस्तै: प्रहरी, rasuwa, 1234)", "Search name, place or number (e.g. police, रसुवा, 1234)");
    const s = q.value.trim();
    /* pinned national hotlines */
    $("cpin").innerHTML = `<p class="cpinh">${T("राष्ट्रिय आपतकालीन", "National emergency")}</p><div class="cpinrow">${PIN.map((n) => ALL.find((x) => x.num === n && !x.district)).filter(Boolean).map((x) => `<a class="pcall" href="tel:${x.num}"><b>${G.num(x.num)}</b><span>${esc(T(x.ne, x.en).split(" (")[0])}</span></a>`).join("")}</div>`;
    /* filters */
    const cats = Object.keys(CAT).filter((k) => ALL.some((x) => x.cat === k && (!dist || !x.district || x.district === dist)));
    /* chips: rebuild only when the set or language changes, so the row keeps its scroll position and the tapped chip keeps focus */
    const ck = G.lang + "|" + cats.join(",");
    if ($("cchips").dataset.k !== ck) {
      $("cchips").dataset.k = ck;
      $("cchips").innerHTML = [["", ["सबै", "All"]], ...cats.map((k) => [k, CAT[k]])].map(([k, v]) => `<button type="button" class="cchip" data-cat="${k}" aria-pressed="false"><span class="cico" aria-hidden="true">${CI[k] || CI.all}</span><span>${esc(T(v[0], v[1]))}</span></button>`).join("");
      $("cchips").querySelectorAll(".cchip").forEach((b) => (b.onclick = () => { if (cat === b.dataset.cat) return; cat = b.dataset.cat; draw(); reveal(b); }));
    }
    if (cat && !cats.includes(cat)) cat = "";
    $("cchips").querySelectorAll(".cchip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === cat)));
    const ds = Object.keys(C.districts || {}).filter((k) => dById[k]);
    const my = dByCode[G.district.get()];
    $("cdsel").innerHTML = `<option value="">${T("सबै जिल्ला", "All districts")}</option>` + ds.map((k) => `<option value="${k}"${k === dist ? " selected" : ""}>${esc(T(dById[k].ne, dById[k].en))}${my && my.id === k ? " · " + T("मेरो जिल्ला", "My district") : ""} (${G.num(String(C.districts[k].length))})</option>`).join("");
    $("cdlab").textContent = T("जिल्ला", "District");
    /* list, grouped: national, then each district */
    const L = ALL.filter((x) => (!cat || x.cat === cat) && (!dist || !x.district || x.district === dist) && match(x, s));
    const nat = ["", T("राष्ट्रिय नम्बर", "National numbers")], dg = ds.map((k) => [k, T(dById[k].ne, dById[k].en)]);
    const groups = dist ? [...dg, nat] : [nat, ...dg]; /* chosen district first, national after */
    $("ccount").textContent = T(`${G.num(String(L.length))} नम्बर`, `${L.length} number${L.length === 1 ? "" : "s"}`);
    $("clist").innerHTML = L.length ? groups.map(([k, h]) => { const r = L.filter((x) => x.district === k); return r.length ? `<section class="cgrp"><h2>${esc(h)} <span>${G.num(String(r.length))}</span></h2><ul>${r.map(row).join("")}</ul></section>` : ""; }).join("")
      : `<div class="na">${T("मिल्ने नम्बर भेटिएन। अर्को शब्द वा सबै जिल्ला छानेर हेर्नुहोस्।", "No matching number. Try another word or choose All districts.")}</div>`;
    $("clist").querySelectorAll(".ccopy").forEach((b) => (b.onclick = async () => {
      const n = b.dataset.n; try { await navigator.clipboard.writeText(n); } catch (e) { const t = document.createElement("textarea"); t.value = n; document.body.append(t); t.select(); document.execCommand("copy"); t.remove(); }
      b.classList.add("ok"); b.setAttribute("title", T("कपी भयो", "Copied")); const f = $("ctoast"); f.textContent = T(`${G.num(n)} कपी भयो`, `${n} copied`); f.hidden = false; setTimeout(() => { b.classList.remove("ok"); f.hidden = true; }, 1600);
    }));
    G.district.name(G.district.get()).then((n) => {
      const mh = `<button type="button" class="dpick" id="myd">📍 ${T("मेरो जिल्ला", "My district")}: <b>${n ? esc(n) : T("छान्नुहोस्", "Choose")}</b> ▾</button>`; if ($("mydist").innerHTML !== mh) $("mydist").innerHTML = mh;
      $("myd").onclick = () => G.district.open(() => { const m = dByCode[G.district.get()]; dist = m && C.districts[m.id] ? m.id : ""; draw(); });
      const mine = my && C.districts[my.id];
      const cd = my && !mine ? `<div class="na"><strong>${esc(n)}: ${T("जिल्लाका नम्बर उपलब्ध छैनन्", "district numbers not available")}</strong>. ${esc(T(C.districts_note_ne, C.districts_note_en))} <a class="callbtn sm" href="tel:1234">☎ ${G.num("1234")} · DEOC</a></div>` : ""; if ($("cdist").innerHTML !== cd) $("cdist").innerHTML = cd;
    });
    $("cnote").innerHTML = esc(T(C.scope_ne, C.scope_en)) + " " + esc(T("विपद् हेल्पलाइन १२३४ ले पुरानो ११४९ लाई प्रतिस्थापन गरेको हो (NDRRMA)।", "Disaster helpline 1234 replaced the older 1149 (NDRRMA).")) +
      (C.imported_from ? ` ${T("रसुवा बुलेटिनबाट ल्याइएका नम्बर", "Numbers from the Rasuwa bulletin")}: <a href="${esc(C.imported_from.url)}" target="_blank" rel="noopener">${T("सम्पर्क पृष्ठ", "contact page")}</a> · ${T("अन्तिम जाँच", "last checked")} ${G.num(C.checked)}.` : "");
    const u = new URL(location.href); [["s", s], ["cat", cat], ["d", dist]].forEach(([k, v]) => (v ? u.searchParams.set(k, v) : u.searchParams.delete(k))); history.replaceState(null, "", u);
  }
  $("cdsel").onchange = (e) => { dist = e.target.value; draw(); };
  let tm; q.oninput = () => { clearTimeout(tm); tm = setTimeout(draw, 80); };
  draw(); G.onLang(draw);
})();
