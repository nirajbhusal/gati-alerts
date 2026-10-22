/* My watchlist: follow districts and river gauges. Stored only in this browser (localStorage "gati-watch"). */
(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), esc = G.esc, R = G.root, KEY = "gati-watch";
  const box = document.getElementById("watchbody"); if (!box) return;
  const [al, D, riv] = await Promise.all(["data/alerts.json", "data/districts.json", "data/rivers.json"].map((p) => G.json(p).catch(() => null)));
  const get = () => { try { const w = JSON.parse(localStorage.getItem(KEY) || "{}"); return { d: w.d || [], r: w.r || [] }; } catch (e) { return { d: [], r: [] }; } };
  const set = (w) => { try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) {} draw(); };
  const now = Date.now(), act = (al ? al.alerts : []).filter((a) => Date.parse(a.expires) > now && !a.supersededBy && a.info.en.params["gati:demo"] !== "true");
  const G2 = riv ? riv.gauges : [];
  function draw() {
    const w = get();
    const drow = w.d.map((c) => { const d = D.find((x) => x.code === c); if (!d) return ""; const n = act.filter((a) => a.districts.includes(c));
      return `<li><span class="wn">📍 ${esc(T(d.ne, d.en))}</span><span class="${n.length ? "tag live" : "meta"}">${n.length ? `${G.num(n.length)} ${T("चालु सूचना", "active alerts")}` : T("चालु सूचना छैन", "no active alerts")}</span><button type="button" class="wx" data-t="d" data-k="${c}" aria-label="${T("हटाउनुहोस्", "Remove")} ${esc(T(d.ne, d.en))}">✕</button></li>`; }).join("");
    const rrow = w.r.map((k) => { const g = G2.find((x) => x.en === k); if (!g) return ""; const st = g.level >= g.danger ? ["खतरा", "Danger", "tag sev-Extreme"] : g.level >= g.warning ? ["चेतावनी", "Warning", "tag sev-Severe"] : ["सामान्य", "Normal", "meta"];
      return `<li><span class="wn">💧 <a href="${R}rivers/">${esc(T(g.ne, g.en))}</a></span><span class="${st[2]}">${G.num(g.level)} ${T("मि.", "m")} · ${T(st[0], st[1])}</span><button type="button" class="wx" data-t="r" data-k="${esc(k)}" aria-label="${T("हटाउनुहोस्", "Remove")} ${esc(T(g.ne, g.en))}">✕</button></li>`; }).join("");
    const dop = D.filter((d) => !w.d.includes(d.code)).sort((a, b) => T(a.ne, a.en).localeCompare(T(b.ne, b.en))).map((d) => `<option value="${d.code}">${esc(T(d.ne, d.en))}</option>`).join("");
    const rop = G2.filter((g) => !w.r.includes(g.en)).map((g) => `<option value="${esc(g.en)}">${esc(T(g.ne, g.en))}</option>`).join("");
    box.innerHTML = (drow || rrow ? `<ul class="wlist">${drow}${rrow}</ul>` : `<p class="meta">${T("जिल्ला वा नदी थपेर यहाँ एकै ठाउँमा हेर्नुहोस्। यो सूची यही ब्राउजरमा मात्र सुरक्षित हुन्छ।", "Add districts or rivers to see them here. The list is saved in this browser only.")}</p>`) +
      `<div class="wadd"><label><span class="sr-only">${T("जिल्ला थप्नुहोस्", "Add district")}</span><select id="wd"><option value="">+ ${T("जिल्ला", "District")}</option>${dop}</select></label>
       <label><span class="sr-only">${T("नदी थप्नुहोस्", "Add river")}</span><select id="wr"><option value="">+ ${T("नदी", "River")}</option>${rop}</select></label></div>` +
      (rrow && riv ? `<p class="meta">${T("नदी", "Rivers")}: ${esc(T(riv.as_of_ne, riv.as_of_en))}</p>` : "");
    box.querySelector("#wd").onchange = (e) => { if (e.target.value) { const w2 = get(); w2.d.push(e.target.value); set(w2); } };
    box.querySelector("#wr").onchange = (e) => { if (e.target.value) { const w2 = get(); w2.r.push(e.target.value); set(w2); } };
    box.querySelectorAll(".wx").forEach((b) => (b.onclick = () => { const w2 = get(); w2[b.dataset.t] = w2[b.dataset.t].filter((x) => x !== b.dataset.k); set(w2); }));
  }
  draw(); G.onLang(draw);
})();
