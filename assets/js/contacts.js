(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc;
  const C = await G.json("data/contacts.json"), D = await G.json("data/districts.json").catch(() => []);
  const q = document.getElementById("csearch");
  const link = (u, n) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`;
  function draw() {
    q.placeholder = T("नम्बर वा सेवा खोज्नुहोस्", "Search a number or service");
    const s = q.value.trim().toLowerCase();
    const L = C.national.filter((c) => !s || [c.num, c.ne, c.en, G.num(c.num)].join(" ").toLowerCase().includes(s));
    document.getElementById("clist").innerHTML = L.length ? L.map((c) => `
      <article class="ccard${/^(100|101|102|1234)$/.test(c.num) ? " key" : ""}">
        <a class="callbtn" href="tel:${c.num}" aria-label="${esc(T("फोन गर्नुहोस्", "Call"))} ${c.num}, ${esc(T(c.ne, c.en))}"><svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg><span class="cnum">${G.num(c.num)}</span></a>
        <div class="cbody"><h2>${esc(T(c.ne, c.en))}</h2>${c.note_ne ? `<p>${esc(T(c.note_ne, c.note_en))}</p>` : ""}
        <p class="meta">${T("स्रोत", "Source")}: ${link(c.src, c.srcName)}${c.src2 ? " · " + link(c.src2, c.src2Name) : ""}</p></div></article>`).join("")
      : `<div class="na">${T("मिल्ने नम्बर भेटिएन।", "No matching number.")}</div>`;
    const my = G.district.get(), dd = (C.districts || {})[my];
    G.district.name(my).then((n) => {
      document.getElementById("mydist").innerHTML = `<button type="button" class="dpick" id="myd">📍 ${T("मेरो जिल्ला", "My district")}: <b>${n ? esc(n) : T("छान्नुहोस्", "Choose")}</b> ▾</button>`;
      document.getElementById("myd").onclick = () => G.district.open(draw);
      document.getElementById("cdist").innerHTML = `<h2 style="margin-top:0">${T("जिल्लाका नम्बर", "District numbers")}${n ? ": " + esc(n) : ""}</h2>` + (dd && dd.length ? "" :
        `<div class="na"><strong>${T("उपलब्ध छैन", "Not available")}</strong>. ${esc(T(C.districts_note_ne, C.districts_note_en))}<div style="margin-top:var(--s3)"><a class="callbtn sm" href="tel:1234">☎ ${G.num("1234")} · DEOC</a></div><p class="meta">${T("अन्तिम जाँच", "Last checked")}: ${G.num(C.checked)}</p></div>`);
    });
    document.getElementById("cnote").textContent = T("यहाँ आपतकालीन नम्बर मात्र राखिएका छन्। विपद् हेल्पलाइन १२३४ ले पुरानो ११४९ लाई प्रतिस्थापन गरेको हो (NDRRMA)।", "Emergency numbers only. Disaster helpline 1234 replaced the older 1149 (NDRRMA).");
  }
  q.oninput = draw; draw(); G.onLang(draw);
})();
