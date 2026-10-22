/* Home: alert list + Leaflet map, from data/alerts.json (built from CAP files). */
(async function () {
  const G = window.Gati;
  const [data, districts] = await Promise.all([G.json("data/alerts.json"), G.json("data/districts.json")]);
  const DN = Object.fromEntries(districts.map((d) => [d.id, d]));
  const now = Date.now();
  data.alerts.forEach((a) => (a.expired = new Date(a.expires).getTime() < now));
  const $ = (id) => document.getElementById(id);
  const sel = $("fDistrict"), sortSel = $("fSort"), showExp = $("fExpired");
  const params = new URLSearchParams(location.search);
  if (params.get("district")) sel.dataset.v = params.get("district");

  function fillSort() { sortSel.querySelectorAll("option").forEach((o) => (o.textContent = o.dataset[G.lang])); }
  function fillDistricts() {
    fillSort();
    const used = new Set(data.alerts.flatMap((a) => a.districts));
    const name = (d) => (G.lang === "ne" ? d.ne : d.en);
    const sorted = [...districts].sort((a, b) => name(a).localeCompare(name(b), G.lang));
    const v = sel.value || sel.dataset.v || "";
    sel.innerHTML = `<option value="">${G.lang === "ne" ? "सबै जिल्ला" : "All districts"}</option>` +
      sorted.map((d) => `<option value="${d.id}">${G.esc(name(d))}${used.has(d.id) ? " •" : ""}</option>`).join("");
    sel.value = v;
  }

  const areaName = (a) => (a.districts[0] ? (G.lang === "ne" ? DN[a.districts[0]]?.ne : DN[a.districts[0]]?.en) || "" : a.info[G.lang].areas[0]?.desc || "");
  function card(a) {
    const i = a.info[G.lang], en = a.info.en;
    const areas = i.areas.map((x) => x.desc).join(" · ");
    const corr = i.params["gati:correction"];
    return `<article class="card alert s-${a.severity}${a.expired ? " expired" : ""}" id="${G.esc(a.identifier)}">
      <div class="chips">${G.sevChip(a.severity)}${G.trustChip(a.trust)}${a.state ? G.trustChip(a.state) : ""}
        ${a.expired ? `<span class="tag exp">${G.lang === "ne" ? "म्याद सकियो" : "Expired"}</span>` : `<span class="tag">${G.lang === "ne" ? "सक्रिय" : "Active"}</span>`}
        <span class="tag">${G.esc(i.event)}</span></div>
      <h3>${G.esc(i.headline)}</h3>
      <p class="meta">📍 ${G.esc(areas)}</p>
      <p class="meta">🕒 ${G.lang === "ne" ? "जारी" : "Issued"}: ${G.npt(a.sent)} · ${G.lang === "ne" ? "म्याद" : "Expires"}: ${G.npt(a.expires)}</p>
      ${corr ? `<div class="correction">✎ ${G.esc(corr)}</div>` : ""}
      ${i.instruction ? `<div class="instr"><strong>${G.lang === "ne" ? "के गर्ने" : "What to do"}:</strong> ${G.esc(i.instruction)}</div>` : ""}
      <p class="meta src">${G.lang === "ne" ? "स्रोत" : "Source"}: <strong>${G.esc(i.senderName)}</strong> · <a href="${G.esc(i.web)}" rel="noopener" target="_blank">${G.lang === "ne" ? "मूल सूचना" : "Original notice"} ↗</a></p>
      <details><summary>${G.lang === "ne" ? "विस्तृत विवरण" : "Details"}</summary>
        ${a.expired && i.instruction ? `<p><strong>${G.lang === "ne" ? "त्यस बेलाको निर्देशन" : "Instruction at the time"}:</strong> ${G.esc(i.instruction)}</p>` : ""}
        <p>${G.esc(i.description)}</p>
        <p class="meta">CAP: urgency ${en.urgency} · severity ${en.severity} · certainty ${en.certainty} · sender <code>${G.esc(a.sender)}</code><br>
        <a href="${G.esc(a.file)}">CAP 1.2 XML</a> · <a href="${G.esc(i.params["gati:bulletinFile"])}" rel="noopener">${G.lang === "ne" ? "बुलेटिन डेटा" : "Bulletin data"}</a></p>
      </details></article>`;
  }

  let map, layer;
  function initMap() {
    if (!window.L) { $("map").innerHTML = '<p class="empty">Map unavailable offline.</p>'; return; }
    map = L.map("map", { scrollWheelZoom: false }).setView([28.2, 84.1], 7);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    layer = L.featureGroup().addTo(map);
  }
  function drawMap(list) {
    if (!map) return;
    layer.clearLayers();
    // draw lower severities first so severe areas sit on top
    [...list].sort((a, b) => G.SEVORDER.indexOf(b.severity) - G.SEVORDER.indexOf(a.severity)).forEach((a) => {
      const c = G.SEVCOLOR[a.severity] || G.SEVCOLOR.Unknown, i = a.info[G.lang];
      const style = { color: c, weight: 2, fillColor: c, fillOpacity: a.expired ? 0.08 : 0.25, dashArray: a.expired ? "5 5" : null };
      const pop = `<strong>${G.esc(i.headline)}</strong><br>${G.esc(i.senderName)}<br>${a.expired ? (G.lang === "ne" ? "म्याद सकियो" : "Expired") : ""} <a href="#${encodeURIComponent(a.identifier)}">${G.lang === "ne" ? "सूचीमा हेर्नुहोस्" : "See in list"}</a>`;
      i.areas.forEach((ar) => {
        ar.polygons.forEach((p) => L.polygon(p, style).bindPopup(pop).addTo(layer));
        ar.circles.forEach((cs) => { const [ll, r] = cs.split(" "); const [la, lo] = ll.split(",").map(Number);
          L.circle([la, lo], { ...style, radius: Number(r) * 1000, fillOpacity: 0.35 }).bindPopup(pop).addTo(layer); });
      });
    });
    if (layer.getLayers().length) map.fitBounds(layer.getBounds(), { padding: [12, 12], maxZoom: 9 });
  }

  function render() {
    const d = sel.value, s = sortSel.value;
    let list = data.alerts.filter((a) => !d || a.districts.includes(d));
    const cmp = {
      severity: (a, b) => G.SEVORDER.indexOf(a.severity) - G.SEVORDER.indexOf(b.severity) || b.sent.localeCompare(a.sent),
      time: (a, b) => b.sent.localeCompare(a.sent),
      area: (a, b) => areaName(a).localeCompare(areaName(b), G.lang) || b.sent.localeCompare(a.sent),
    }[s];
    list.sort(cmp);
    const act = list.filter((a) => !a.expired), exp = list.filter((a) => a.expired);
    $("nActive").textContent = `(${G.num(act.length)})`;
    $("nExpired").textContent = `(${G.num(exp.length)})`;
    $("active").innerHTML = act.length ? act.map(card).join("") : `<div class="empty">${G.lang === "ne"
      ? "अहिले यो क्षेत्रका लागि गतिले प्रसारण गरेको कुनै सक्रिय सूचना छैन। यसको अर्थ जोखिम छैन भन्ने होइन — DHM, NDRRMA र स्थानीय प्रशासनको सूचना पनि हेर्नुहोस्।"
      : "Gati is not relaying any active notice for this area right now. That does not mean there is no risk; also check DHM, NDRRMA and your local administration."}</div>`;
    $("expired").innerHTML = exp.map(card).join("");
    document.querySelector(".g-exp").hidden = !showExp.checked;
    drawMap(showExp.checked ? list : act);
    $("legend").innerHTML = G.SEVORDER.map(G.sevChip).join("");
    $("trustLegend").innerHTML = Object.keys(G.TRUST).map(G.trustChip).join("");
    $("gen").textContent = (G.lang === "ne" ? "फिड बनेको: " : "Feed built: ") + G.npt(data.generated);
    const u = new URL(location); d ? u.searchParams.set("district", d) : u.searchParams.delete("district"); history.replaceState(null, "", u);
  }
  initMap(); fillDistricts(); render();
  sel.onchange = sortSel.onchange = showExp.onchange = render;
  G.onLang(() => { fillDistricts(); render(); });
})();
