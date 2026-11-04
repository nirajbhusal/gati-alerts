/* Home info strip below Nepal Now: quick checks, source freshness, per-agency cards, rivers, latest NSC quake, emergency numbers.
   Gati relays, never issues. Every item carries its source and time. Counts are per agency and never added together. */
(function () {
  const box = document.getElementById("hinfo"), G = window.Gati; if (!box || !G) return;
  const R = G.root, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, N = (s) => G.num(String(s));
  const tm = (iso) => (iso ? `<time datetime="${E(iso)}">${E(G.npt(iso))}</time>` : T("समय छैन", "no time"));
  const J = (p) => fetch(R + p).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const B = {};
  B.quick = () => `<nav class="hiqn" aria-label="${E(T("छिटो जाँच", "Quick checks"))}"><a href="${R}route/">${T("सडक मार्ग जाँच्नुहोस्", "Check a road route")}</a><a href="${R}trek/">${T("पदमार्ग जाँच्नुहोस्", "Check a trek")}</a><a href="${R}affected/">${T("मेरो जिल्ला जाँच्नुहोस्", "Check my district")}</a></nav>`;
  B.fresh = (D) => { if (!D.sh) return ""; const S = D.sh.sources, L = [["dhm-hydrology", "DHM"], ["ndrrma", "NDRRMA"], ["nepal-police", T("नेपाल प्रहरी", "Nepal Police")], ["nsc", "NSC"], ["dor-navigate", "DoR NAVIGATE"]];
    return `<b>${T("स्रोतबाट पछिल्लो अद्यावधिक", "Last updated by source")}:</b> ` + L.filter(([k]) => S[k]).map(([k, n]) => { const s = S[k]; return `<span class="hifs">${n}: ${s.lastSuccess ? tm(s.lastSuccess) : `${T("पछिल्लो जाँचमा पुग्न सकिएन", "not reachable at last check")} (${tm(s.lastChecked)})`}</span>`; }).join(" · ") + ` · <a href="${R}sources/">${T("स्रोत स्थिति", "Source health")}</a>`; };
  /* Today at a glance: one tile per source, each with its own small graphic, source and time. Counts stay per agency, never added. */
  const IC = { river: '<path d="M3 8c2.5-2 4.5-2 7 0s4.5 2 7 0 3-1.5 4-1"/><path d="M3 13c2.5-2 4.5-2 7 0s4.5 2 7 0 3-1.5 4-1"/><path d="M3 18c2.5-2 4.5-2 7 0s4.5 2 7 0 3-1.5 4-1"/>',
    road: '<path d="M8 3 5 21M16 3l3 18"/><path d="M12 4v3M12 10.5v3M12 17v3"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>' };
  G.hic = (k) => `<svg class="hgi" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k] || ""}</svg>`;
  const tile = (ic, ne, en, href, big, graphic, src) => `<a class="hgt" href="${href}"><span class="hgh">${G.hic(ic)}<b>${T(ne, en)}</b></span><span class="hgbig">${big}</span>${graphic}<span class="meta">${src}</span></a>`;
  const LV = { green: ["#2E9E5B", "चेतावनी छैन", "No warning"], yellow: ["#E8B500", "सतर्क", "Be aware"], orange: ["#F28C1E", "तयार रहनुहोस्", "Be prepared"], red: ["#D7263D", "कदम चाल्नुहोस्", "Take action"] };
  B.agency = (D) => { const act = (f) => D.al.filter((a) => !a.expired && Date.parse(a.expires) > Date.now() && !a.supersededBy && f(a)), last = (xs) => xs.map((a) => a.sent).sort().pop();
    const out = [];
    const v = D.rv; if (v && v.gauges.length) { const g = v.gauges, ok = g.filter((x) => x.level < x.warning).length;
      out.push(tile("river", "नदी", "Rivers", R + "rivers/", `${N(ok)}/${N(g.length)} <small>${T("गेज चेतावनी तहमुनि", "gauges below warning")}</small>`,
        `<span class="hgbars" aria-hidden="true">${g.map((x) => `<i style="--h:${Math.min(100, Math.round((x.level / x.danger) * 100))}%;--c:${x.level >= x.danger ? "#D7263D" : x.level >= x.warning ? "#F28C1E" : "#2E9E5B"}" title="${E(T(x.ne, x.en))}"></i>`).join("")}</span><span class="hgkey">${T("बार = सतह, खतरा तहको तुलनामा", "Bar = level against danger line")}</span>`,
        `${T("स्रोत", "Source")}: <span>DHM</span> · ${E(T(v.as_of_ne, v.as_of_en))}`)); }
    const b5 = D.wx && D.wx.bulletin5; if (b5 && b5.days) { const worst = b5.days.reduce((m, d) => (["green", "yellow", "orange", "red"].indexOf(d.level) > ["green", "yellow", "orange", "red"].indexOf(m) ? d.level : m), "green"), lv = LV[worst] || LV.green;
      out.push(tile("sun", "५ दिनको चेतावनी", "5-day warning", R + "weather/", `<small>${T(lv[1], lv[2])}</small>`,
        `<span class="hgdots" aria-hidden="true">${b5.days.map((d) => `<i style="--c:${(LV[d.level] || LV.green)[0]}"></i>`).join("")}</span>`,
        `${T("स्रोत", "Source")}: DHM · ${T("जारी", "issued")} ${tm(b5.issued)}`)); }
    const rd = D.rd; if (rd && rd.routes) { const c = { open: 0, oneway: 0, blocked: 0, none: 0 }; rd.routes.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1)); const n = rd.routes.length, pc = (k) => ((c[k] || 0) / n) * 100;
      out.push(tile("road", "सडक", "Roads", R + "roads/", `${N(c.open)}/${N(n)} <small>${T("मुख्य सडक खुला", "main roads open")}</small>`,
        `<span class="hgstack" aria-hidden="true"><i style="width:${pc("open")}%;--c:#2E9E5B"></i><i style="width:${pc("oneway")}%;--c:#F28C1E"></i><i style="width:${pc("blocked")}%;--c:#D7263D"></i><i style="width:${pc("none")}%;--c:#C9D3DD"></i></span><span class="hgkey">${T("एकतर्फी", "One way")} ${N(c.oneway)} · ${T("बन्द", "Blocked")} ${N(c.blocked || 0)} · ${T("पुष्टि छैन", "Not confirmed")} ${N(c.none)}</span>`,
        `${T("स्रोत", "Source")}: ${T("नेपाल प्रहरी", "Nepal Police")} · ${E(T(rd.as_of_ne, rd.as_of_en))}`)); }
    const dhm = act((a) => a.sender === "hydrology.gov.np"), nd = act((a) => a.sender === "ndrrma.gov.np"), pol = act((a) => a.sender === "nepalpolice.gov.np"), c = D.caan;
    const row = (n, cnt, when) => `<li><span>${n}</span><b>${N(cnt)}</b>${when ? `<span class="meta">${when}</span>` : ""}</li>`;
    out.push(`<a class="hgt" href="${R}alerts/"><span class="hgh">${G.hic("bell")}<b>${T("चालु सूचना, निकाय अनुसार", "Active notices by agency")}</b></span><ul class="hgag">${row("DHM", dhm.length, dhm.length ? tm(last(dhm)) : "")}${row("NDRRMA", nd.length, nd.length ? tm(last(nd)) : "")}${row(T("नेपाल प्रहरी", "Nepal Police"), pol.length, pol.length ? tm(last(pol)) : "")}${c ? row("CAAN", c.notices, T("जाँचेको", "checked") + " " + tm(c.checked)) : ""}</ul><span class="meta">${T("प्रत्येक निकायको संख्या छुट्टै; कहिल्यै जोडिँदैन।", "Each agency's count is separate; never added together.")}</span></a>`);
    return `<h2 class="hgt0">${T("आजको झलक", "Today at a glance")}</h2><div class="hglg">${out.join("")}</div>`; };
  B.rivers = (D) => { const v = D.rv; if (!v) return ""; const hot = v.gauges.filter((g) => g.level >= g.warning); if (!hot.length) return "";
    const src = `<span class="meta">${T("स्रोत", "Source")}: <a href="${E(v.url)}" target="_blank" rel="noopener">DHM</a> · ${E(T(v.as_of_ne, v.as_of_en))}</span>`;
    return `<b>${T("नदी", "Rivers")}:</b> ` + (hot.length ? hot.map((g) => `${E(T(g.ne, g.en))} ${N(g.level)} m ${g.level >= g.danger ? `<span class="sev sev-Extreme">${T("खतरा तह", "danger level")}</span>` : `<span class="sev sev-Moderate">${T("चेतावनी तह", "warning level")}</span>`}`).join(" · ") : T("चेतावनी वा खतरा तहमा कुनै DHM मापन केन्द्र छैन।", "No DHM gauge at warning or danger level.")) + " " + src; };
  B.quake = (D) => { const q = D.al.filter((a) => a.sender === "seismonepal.gov.np" && parseFloat((a.info.en.params || {})["gati:magnitude"]) >= 4).sort((a, b) => (a.sent < b.sent ? 1 : -1))[0];
    if (!q) return `<b>${T("भूकम्प", "Earthquake")}:</b> ${T("NSC को M4 माथिको हालको भूकम्प छैन।", "No recent NSC quake above M4.")}`;
    const i = q.info[G.lang === "ne" ? "ne" : "en"] || q.info.en;
    return `<b>${T("पछिल्लो भूकम्प (M4 माथि)", "Latest quake (M4+)")}:</b> <a href="${R}alerts/${E(q.identifier)}/">${E(i.headline)}</a> <span class="meta">· ${T("स्रोत", "Source")}: <a href="${E(i.web)}" target="_blank" rel="noopener">NSC</a> · ${tm(q.sent)}</span>`; };
  /* Services row: fuel price (NOC), hospital beds and blood (MoHP), emergency numbers. Each with its own source and time. */
  const IC2 = { fuel: '<path d="M5 20.5V5.5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15"/><path d="M4 20.5h12M7.5 7.5h5v4h-5z"/><path d="M15 10h2a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
    bed: '<path d="M3 18.5V7M3 14h18v4.5M21 14v-2.5a3 3 0 0 0-3-3h-7v5.5"/><circle cx="7" cy="11" r="2"/>', drop: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/><path d="M12 11v6M9 14h6"/>',
    phone: '<path d="M6.5 3.5h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>' };
  const ic2 = (k) => `<svg class="hgi" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC2[k]}</svg>`;
  B.sos = (D) => { const out = [];
    const f = D.fu, g0 = f && f.groups && f.groups[0];
    if (g0) out.push(`<a class="hgt" href="${R}fuel/"><span class="hgh">${ic2("fuel")}<b>${T("इन्धन मूल्य", "Fuel price")}</b></span><span class="hgbig">${T("रु.", "NPR")} ${N(g0.price.petrol)} <small>${T("पेट्रोल/लिटर", "petrol/litre")}</small></span><span class="hgkey">${T("डिजेल", "Diesel")} ${N(g0.price.diesel)} · ${E(T(g0.name_ne, g0.name_en))}</span><span class="meta">${T("स्रोत", "Source")}: NOC · ${T("लागू", "effective")} ${E(G.npt(f.effective).split(" · ")[0])}</span></a>`);
    const h = D.hl; if (h && h.beds) out.push(`<a class="hgt" href="${R}health/"><span class="hgh">${ic2("bed")}<b>${T("अस्पताल बेड र ब्लड बैंक", "Hospital beds & blood")}</b></span><span class="hgbig">${N(h.beds.items.length)} <small>${T("अस्पताल", "hospitals")}</small> · ${N((h.blood.items || []).length)} <small>${T("ब्लड बैंक", "blood banks")}</small></span><span class="hgkey">${T("नि:शुल्क बेड र रगतको मौज्दात हेर्नुहोस्", "See free beds and blood stock")}</span><span class="meta">${T("स्रोत", "Source")}: ${T("स्वास्थ्य मन्त्रालय", "MoHP")} · ${T("जाँचेको", "checked")} ${tm(h.checked)}</span></a>`);
    const c = D.ct; if (c) { const L = c.national.filter((x) => x.num !== "1149").slice(0, 4);
      out.push(`<div class="hgt"><span class="hgh">${ic2("phone")}<b>${T("आपतकालीन नम्बर", "Emergency numbers")}</b></span><span class="hgcall">${L.map((x) => `<a href="tel:${E(x.num)}"><b>${N(x.num)}</b> ${E(T(x.ne, x.en))}</a>`).join("")}</span><span class="meta"><a href="${R}contacts/">${T("सबै नम्बर", "All numbers")}</a> · ${T("निकायले सूचीकृत", "as listed by the agencies")}</span></div>`); }
    return `<div class="hglg hgsv">${out.join("")}</div>`; };
  /*BLOCKS*/
  Promise.all(["data/source-health.json", "data/alerts.json", "data/caan.json", "data/rivers.json", "data/contacts.json", "data/roads.json", "data/weather.json", "data/fuel.json", "data/health.json"].map(J)).then(([sh, al, caan, rv, ct, rd, wx, fu, hl]) => {
    const D = { sh, al: al ? al.alerts : [], caan, rv, ct, rd, wx, fu, hl };
    const draw = () => Object.keys(B).forEach((k) => { const el = box.querySelector(`[data-b="${k}"]`); if (el) { try { el.innerHTML = B[k](D); } catch (e) { el.innerHTML = ""; } } });
    draw(); G.onLang(draw);
  });
})();
