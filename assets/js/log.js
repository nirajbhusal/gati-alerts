/* Feature 7: /log/ public change log. Every Alert, Update and Cancel from data/alerts.json, newest first,
   with sent time, agency, what it replaces, original notice, CAP file, SHA-256 of the CAP file and its GitHub history. */
(async function () {
  const G = window.Gati, T = (ne, en) => (G.lang === "ne" ? ne : en), E = G.esc, R = G.root;
  const REPO = "https://github.com/nirajbhusal/gati-alerts/commits/main/";
  const MT = { Alert: ["मूल सूचना", "Alert"], Update: ["अद्यावधिक", "Update"], Cancel: ["रद्द", "Cancel"] };
  const AL = await G.json("data/alerts.json"); let only = "all";
  const rows = [...AL.alerts].sort((a, b) => b.sent.localeCompare(a.sent));
  const hashes = {};
  async function sha(file) { if (hashes[file]) return hashes[file];
    try { const b = await (await fetch(R + file)).arrayBuffer(); const h = await crypto.subtle.digest("SHA-256", b); return (hashes[file] = [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, "0")).join("")); } catch (e) { return ""; } }
  function draw() {
    const L = rows.filter((a) => only === "all" || a.msgType === only);
    document.getElementById("log").innerHTML = L.map((a) => { const i = a.info[G.lang] || a.info.ne, ref = (a.refIds || [])[0];
      return `<li class="logi mt-${a.msgType}"><p class="logh"><span class="logt">${T(MT[a.msgType][0], MT[a.msgType][1])}</span> <b>${G.npt(a.sent)}</b> · ${E(G.agencyOf(a))} ${G.trustChip(a.trust)}</p>
        <p class="logx"><a href="${R}alerts/${E(a.identifier)}/">${E(i.headline)}</a></p>
        ${ref ? `<p class="meta">${T("यसले बदल्छ", "Replaces")}: <a href="${R}alerts/${E(ref)}/">${E(ref)}</a></p>` : ""}
        <p class="meta"><a href="${E(i.web)}" target="_blank" rel="noopener">${T("मूल सूचना", "Original notice")} ↗</a> · <a href="${R}${E(a.file)}">CAP XML</a> · <a href="${REPO}${E(a.file)}" target="_blank" rel="noopener">${T("GitHub इतिहास", "GitHub history")} ↗</a></p>
        <p class="meta logsha">SHA-256: <code data-f="${E(a.file)}">…</code></p></li>`; }).join("");
    document.getElementById("lognote").textContent = T(`डेटा: ${G.npt(AL.generated)} · पहिचान: CAP identifier`, `Data: ${G.npt(AL.generated)} · IDs are CAP identifiers`);
    document.querySelectorAll(".logsha code").forEach(async (c) => { c.textContent = (await sha(c.dataset.f)) || T("उपलब्ध छैन", "not available"); });
  }
  document.querySelectorAll(".logf button").forEach((b) => (b.onclick = () => { only = b.dataset.t; document.querySelectorAll(".logf button").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); }));
  draw(); G.onLang(draw);
})();
