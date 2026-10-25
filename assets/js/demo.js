/* Gati demo mode (?demo=1). Client-side only: a scripted, FICTIONAL Budhi Gandaki landslide-dam flood
   scenario (Alert at 0 s, Update at 20 s, Cancel at 40 s, ends at 60 s). Demo messages exist only in this
   tab's memory; nothing is written to data/, the CAP feed or any server. ?demo=0 or the Exit button stops it.
   Loaded synchronously by common.js before page scripts, so it can wrap Gati.json(). */
(function () {
  const G = window.Gati, KEY = "gati-demo-start", q = new URLSearchParams(location.search);
  if (q.get("demo") === "0") { sessionStorage.removeItem(KEY); return; }
  if (q.get("demo") === "1" && !sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, String(Date.now()));
  const start = +sessionStorage.getItem(KEY);
  if (!start) return;
  const LEN = 60000, STEPS = [0, 20000, 40000];
  const el = () => Date.now() - start;
  const phase = () => (el() >= STEPS[2] ? 2 : el() >= STEPS[1] ? 1 : 0);
  if (el() > LEN + 30000) { sessionStorage.removeItem(KEY); return; } /* stale demo from earlier: stop */
  G.demo = true;
  const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");
  const D = [["NP0436", "गोरखा जिल्ला", "Gorkha district"], ["NP0330", "धादिङ जिल्ला", "Dhading district"]];
  const NOTE = "DEMO ONLY. Fictional exercise scenario generated in the browser by Gati demo mode. Not a real alert, not from any agency.";
  function msg(k) {
    const t = start + STEPS[k], id = ["demo.budhigandaki-alert", "demo.budhigandaki-update", "demo.budhigandaki-cancel"][k];
    const mt = ["Alert", "Update", "Cancel"][k], sev = ["Severe", "Extreme", "Minor"][k];
    const H = [
      ["[DEMO] बुढीगण्डकी: पहिरोले नदी थुनियो, ताल बन्दै (काल्पनिक अभ्यास)", "[DEMO] Budhi Gandaki: landslide blocks river, lake forming (fictional exercise)"],
      ["[DEMO] बुढीगण्डकी: थुनिएको ताल फुट्ने जोखिम बढ्यो, तटीय बस्ती खाली गर्ने अभ्यास (काल्पनिक)", "[DEMO] Budhi Gandaki: dam-burst risk rises, riverside evacuation drill (fictional)"],
      ["[DEMO] बुढीगण्डकी अभ्यास सकियो: सूचना रद्द (काल्पनिक)", "[DEMO] Budhi Gandaki exercise over: notice cancelled (fictional)"]][k];
    const I = [["नदी किनारबाट टाढा बस्नुहोस्। यो अभ्यास मात्र हो।", "Stay away from the riverbank. This is an exercise only."],
      ["अग्लो ठाउँमा जानुहोस्। यो अभ्यास मात्र हो।", "Move to high ground. This is an exercise only."],
      ["अभ्यास सकियो। वास्तविक सूचनाका लागि आधिकारिक स्रोत हेर्नुहोस्।", "Exercise over. Check official sources for real notices."]][k];
    const info = (L, j) => ({ category: "Geo", event: L === "ne" ? "DEMO: पहिरोले थुनिएको नदी" : "DEMO: landslide-dammed river", responseType: k === 2 ? "AllClear" : k ? "Evacuate" : "Monitor",
      urgency: k === 2 ? "Past" : "Immediate", severity: sev, certainty: "Possible", effective: iso(t), onset: iso(t), expires: iso(start + LEN + 3600e3),
      contact: "DEMO", senderName: L === "ne" ? "DEMO (काल्पनिक अभ्यास, कुनै निकाय होइन)" : "DEMO (fictional exercise, no agency)",
      headline: H[j], description: (L === "ne" ? "यो गतिको डेमो मोडले ब्राउजरमै बनाएको काल्पनिक परिदृश्य हो। वास्तविक सूचना होइन। " : "This is a fictional scenario made in the browser by Gati demo mode. It is not a real alert. ") + H[j],
      instruction: I[j], web: location.pathname.replace(/[^/]*$/, "") + "?demo=0",
      params: { "gati:trustLevel": "Demo", "gati:sourceUrl": "#demo", "gati:sourceTime": iso(t), "gati:hazard": "flood", "gati:summary160": H[j], "gati:demo": "true" },
      areas: D.map((d) => ({ desc: d[j === 0 ? 1 : 2] || d[1], circles: [], geocodes: { "NP-DISTRICT": d[0] } })) });
    return { identifier: id, sender: "demo.invalid", sent: iso(t), status: "Exercise", msgType: mt, scope: "Public", note: NOTE,
      references: k ? `demo.invalid,${["demo.budhigandaki-alert", "demo.budhigandaki-update"][k - 1]},${iso(start + STEPS[k - 1])}` : null,
      file: null, demo: true, info: { ne: info("ne", 0), en: info("en", 1) }, trust: "Demo", state: k === 2 ? null : null, hazard: "flood", severity: sev,
      expires: iso(start + LEN + 3600e3), districts: D.map((d) => d[0]), expired: false,
      areas: D.map((d) => ({ code: d[0], circles: [], ne: d[1], en: d[2] })), refIds: [] };
  }
  function msgs() {
    const p = phase(), list = [0, 1, 2].slice(0, p + 1).map(msg);
    const chain = list.map((m) => ({ id: m.identifier, msgType: m.msgType, sent: m.sent, state: null }));
    list.forEach((m, k) => { m.chain = list.length > 1 ? chain : []; m.supersededBy = k < list.length - 1 ? list[list.length - 1].identifier : null;
      m.refIds = k ? [list[k - 1].identifier] : []; });
    return list.reverse();
  }
  G.demoAlerts = msgs();
  G.TRUST.Demo = ["अभ्यास (DEMO)", "Demo exercise", "⚠"];
  const orig = G.json;
  G.json = (p) => orig(p).then((d) => (p === "data/alerts.json" ? Object.assign({}, d, { alerts: msgs().concat(d.alerts), count: d.count, demo: true }) : d));
  /* Banner */
  const bar = document.createElement("div");
  bar.className = "demobar"; bar.setAttribute("role", "status");
  document.body.prepend(bar);
  const draw = () => {
    const p = phase(), s = Math.max(0, Math.ceil((LEN - el()) / 1000)), done = el() >= LEN;
    const st = G.lang === "ne" ? ["मूल सूचना", "अद्यावधिक", "रद्द"][p] : ["Alert", "Update", "Cancel"][p];
    bar.innerHTML = `<strong>नमुना डेटा · Demo data</strong> ${G.lang === "ne"
      ? `काल्पनिक अभ्यास मात्र: बुढीगण्डकी पहिरो-ताल बाढी। वास्तविक सूचना होइन, कुनै डेटा लेखिँदैन। चरण: ${st}${done ? " · सकियो" : " · " + G.num(s) + " से."}`
      : `Fictional exercise only: Budhi Gandaki landslide-dam flood. Not a real alert; no data is written. Step: ${st}${done ? " · finished" : " · " + s + " s left"}`}
      <a href="?demo=1" data-restart>${G.lang === "ne" ? "फेरि सुरु" : "Restart"}</a> <a href="?demo=0">${G.lang === "ne" ? "डेमो बन्द" : "Exit demo"}</a>`;
    bar.querySelector("[data-restart]").onclick = () => sessionStorage.removeItem(KEY);
  };
  draw(); G.onLang(draw);
  let last = phase();
  const iv = setInterval(() => {
    draw();
    if (phase() !== last) { last = phase(); location.reload(); }
    if (el() >= LEN) clearInterval(iv);
  }, 1000);
})();
