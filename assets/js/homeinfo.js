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
  /*BLOCKS*/
  Promise.all(["data/source-health.json", "data/alerts.json", "data/caan.json", "data/rivers.json", "data/contacts.json", "data/roads.json"].map(J)).then(([sh, al, caan, rv, ct, rd]) => {
    const D = { sh, al: al ? al.alerts : [], caan, rv, ct, rd };
    const draw = () => Object.keys(B).forEach((k) => { const el = box.querySelector(`[data-b="${k}"]`); if (el) { try { el.innerHTML = B[k](D); } catch (e) { el.innerHTML = ""; } } });
    draw(); G.onLang(draw);
  });
})();
