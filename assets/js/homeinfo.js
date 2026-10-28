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
  B.agency = (D) => { const act = (f) => D.al.filter((a) => !a.expired && f(a)), last = (xs) => xs.map((a) => a.sent).sort().pop();
    const card = (ne, en, n, unit, href, srcH, when) => `<a class="hiac" href="${href}"><b>${E(T(ne, en))}</b><span class="hin">${N(n)}</span><span class="meta">${unit}</span><span class="meta">${srcH}${when ? " · " + when : ""}</span></a>`;
    const dhm = act((a) => a.sender === "hydrology.gov.np"), nd = act((a) => a.sender === "ndrrma.gov.np"), rdA = act((a) => a.hazard === "road" && a.sender === "nepalpolice.gov.np");
    const c = D.caan;
    return `<div class="hiag">${card("DHM", "DHM", dhm.length, T("चालु सूचना", "active notices"), R + "weather/", "DHM", dhm.length ? tm(last(dhm)) : "")}
      ${card("NDRRMA", "NDRRMA", nd.length, T("चालु सूचना", "active notices"), R + "alerts/", "NDRRMA", nd.length ? tm(last(nd)) : "")}
      ${c ? card("CAAN", "CAAN", c.notices, E(T(c.latest_ne, c.latest_en)), c.url, T("CAAN वेबसाइट, जाँचेको", "CAAN website, checked"), tm(c.checked)) : ""}
      ${card("सडक", "Roads", rdA.length, T("नेपाल प्रहरीको चालु सडक अवरोध सूचना", "active Nepal Police road blockage notices"), R + "roads/", T("नेपाल प्रहरी", "Nepal Police"), rdA.length ? tm(last(rdA)) : (D.rd ? tm(D.rd.as_of) : ""))}</div>
      <p class="meta">${T("प्रत्येक निकायको संख्या छुट्टै; कहिल्यै जोडिँदैन।", "Each agency's count is separate; never added together.")}</p>`; };
  B.rivers = (D) => { const v = D.rv; if (!v) return ""; const hot = v.gauges.filter((g) => g.level >= g.warning);
    const src = `<span class="meta">${T("स्रोत", "Source")}: <a href="${E(v.url)}" target="_blank" rel="noopener">DHM</a> · ${E(T(v.as_of_ne, v.as_of_en))}</span>`;
    return `<b>${T("नदी", "Rivers")}:</b> ` + (hot.length ? hot.map((g) => `${E(T(g.ne, g.en))} ${N(g.level)} m ${g.level >= g.danger ? `<span class="sev sev-Extreme">${T("खतरा तह", "danger level")}</span>` : `<span class="sev sev-Moderate">${T("चेतावनी तह", "warning level")}</span>`}`).join(" · ") : T("चेतावनी वा खतरा तहमा कुनै DHM मापन केन्द्र छैन।", "No DHM gauge at warning or danger level.")) + " " + src; };
  B.quake = (D) => { const q = D.al.filter((a) => a.sender === "seismonepal.gov.np" && parseFloat((a.info.en.params || {})["gati:magnitude"]) >= 4).sort((a, b) => (a.sent < b.sent ? 1 : -1))[0];
    if (!q) return `<b>${T("भूकम्प", "Earthquake")}:</b> ${T("NSC को M4 माथिको हालको भूकम्प छैन।", "No recent NSC quake above M4.")}`;
    const i = q.info[G.lang === "ne" ? "ne" : "en"] || q.info.en;
    return `<b>${T("पछिल्लो भूकम्प (M4 माथि)", "Latest quake (M4+)")}:</b> <a href="${R}alerts/${E(q.identifier)}/">${E(i.headline)}</a> <span class="meta">· ${T("स्रोत", "Source")}: <a href="${E(i.web)}" target="_blank" rel="noopener">NSC</a> · ${tm(q.sent)}</span>`; };
  B.sos = (D) => { const c = D.ct; if (!c) return ""; const L = c.national.filter((x) => x.num !== "1149");
    return `<b>${T("आपतकालीन नम्बर", "Emergency numbers")}:</b> ` + L.map((x) => `<a href="tel:${E(x.num)}">${E(T(x.ne, x.en))} ${N(x.num)}</a>`).join(" · ") + ` <span class="meta">· ${T("निकायले सूचीकृत गरेअनुसार", "as each agency lists them")}, <a href="${R}contacts/">${T("स्रोत", "sources")}</a> · ${T("जाँचेको", "checked")} ${E(N(c.checked))}</span>`; };
  /*BLOCKS*/
  Promise.all(["data/source-health.json", "data/alerts.json", "data/caan.json", "data/rivers.json", "data/contacts.json", "data/roads.json"].map(J)).then(([sh, al, caan, rv, ct, rd]) => {
    const D = { sh, al: al ? al.alerts : [], caan, rv, ct, rd };
    const draw = () => Object.keys(B).forEach((k) => { const el = box.querySelector(`[data-b="${k}"]`); if (el) { try { el.innerHTML = B[k](D); } catch (e) { el.innerHTML = ""; } } });
    draw(); G.onLang(draw);
  });
})();
