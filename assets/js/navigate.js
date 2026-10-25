/* DoR NAVIGATE items on /roads/ and /route/: every record, matched to a route or not, with status,
   source, reported time (NPT), checked time and trust. Unmatched records are listed but change no route. */
(async function () {
  const G = window.Gati, el = document.getElementById("navlist"); if (!G || !el) return;
  const NV = await G.json("data/navigate.json").catch(() => null), RD = await G.json("data/roads.json").catch(() => null);
  const C = { open: "#16a34a", partial: "#f59e0b", blocked: "#dc2626", none: "#8a96a3" };
  const draw = () => { const T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc;
    const L = { open: T("खुला", "Open"), partial: T("आंशिक", "Partial"), blocked: T("अवरुद्ध", "Blocked"), none: T("पुष्टि नभएको", "Not confirmed") };
    if (!NV) { el.innerHTML = ""; return; }
    const rn = (id) => { const r = RD && RD.routes.find((x) => x.id === id); return r ? T(r.name_ne, r.name_en) : ""; };
    el.innerHTML = `<h2>${T("सडक विभाग NAVIGATE", "DoR NAVIGATE")} ${G.trustChip("Official")}</h2>
      ${NV.stale ? `<p class="navstale">${T("सडक विभाग NAVIGATE ले पछिल्लो पटक जवाफ दिएन; अन्तिम राम्रो डेटा देखाइएको छ।", "DoR NAVIGATE did not answer on the last check; showing the last good data.")}</p>` : ""}
      <p class="meta">${T("स्रोत", "Source")}: <a href="${E(NV.url)}" target="_blank" rel="noopener">DoR NAVIGATE ↗</a> · ${T("जाँचेको", "Checked")} ${G.npt(NV.checked_at)}</p>
      ${NV.items.length ? `<ul class="navitems">${NV.items.map((i) => `<li class="nv-${i.status}" style="--nc:${C[i.status]}"><p><span class="navst"><i></i>${L[i.status]}</span> <b>${E(i.road_name || "")}</b> <span class="meta">${E(i.road_refno)}${i.link_code ? " · " + E(i.link_code) : ""}</span></p>
        <p>${E(i.location || "")}${i.district ? ` · ${E(i.district)}` : ""}${i.reason ? ` · ${E(i.reason)}` : ""}</p>
        ${i.status_note ? `<p class="meta">${T(i.status_note === "older than 72 h" ? "७२ घण्टाभन्दा पुरानो" : "अनुमानित अन्त्य समय नाघ्यो, नयाँ सूचना छैन", i.status_note === "older than 72 h" ? "Older than 72 h" : "Past its estimated end with nothing newer")}</p>` : ""}
        <p class="meta">${i.route ? `${T("मार्ग", "Route")}: ${E(rn(i.route))}` : T("कुनै मार्गसँग मेल खाएन; मार्गको अवस्था बदलिँदैन", "Not matched to a route; does not change route status")}</p>
        <p class="meta">${T("रिपोर्ट गरिएको", "Reported")}: ${G.npt(i.reported_at)} · ${T("जाँचेको", "Checked")}: ${G.npt(i.checked_at)} · <a href="${E(i.url)}" target="_blank" rel="noopener">${T("मूल स्रोत", "Original source")} ↗</a> ${G.trustChip(i.trust)}</p></li>`).join("")}</ul>` : `<p>${T("अहिले NAVIGATE मा कुनै सडक अवरोध छैन।", "No road closures on NAVIGATE right now.")}</p>`}`; };
  draw(); G.onLang(draw);
})();
