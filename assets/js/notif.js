/* Alerts & notifications (notifications/): the notification list and every notification setting in one place.
   Moved here from Profile & Settings. Official alerts only (data/alerts.json), each with its source and source time.
   Unread marks, districts and choices stay in this browser (gati-notif-prefs, gati-notif-seen, gati-notif-read, gati-watch).
   Browser notifications are shown only while a Gati tab is open; permission is asked only on tap. No server push is built here. */
(function () {
  const G = window.Gati; if (!G || document.body.dataset.page !== "notifications") return;
  const R = G.root, E = G.esc, L = (a, b) => (G.lang === "ne" ? a : b), $ = (id) => document.getElementById(id);
  const HZ = [["flood", "बाढी", "Flood"], ["landslide", "पहिरो", "Landslide"], ["earthquake", "भूकम्प", "Earthquake"], ["weather", "मौसम", "Weather"], ["road", "सडक", "Road"], ["fire", "आगलागी", "Fire"], ["glof", "हिमताल", "GLOF"]];
  const SV = ["Unknown", "Minor", "Moderate", "Severe", "Extreme"];
  const getW = () => { try { return JSON.parse(localStorage.getItem("gati-watch") || "{}"); } catch (e) { return {}; } };
  const setW = (w) => { try { localStorage.setItem("gati-watch", JSON.stringify(w)); } catch (e) {} };
  const readSet = () => { try { return JSON.parse(localStorage.getItem("gati-notif-read") || "[]"); } catch (e) { return []; } };
  const markRead = (id) => { const r = readSet(); if (!r.includes(id)) { r.push(id); try { localStorage.setItem("gati-notif-read", JSON.stringify(r.slice(-500))); } catch (e) {} } };
  let DL = [];
  const dn = (c) => { const d = DL.find((x) => x.code === c) || {}; return L(d.ne || c, d.en || c); };
  const item = (a, unread) => { const i = a.info[G.lang] || a.info.ne;
    return `<li class="${unread ? "ntnew" : ""}"><a href="${R}alerts/${E(a.identifier)}/" data-id="${E(a.identifier)}">${unread ? `<span class="ntdot" aria-label="${L("नपढिएको", "Unread")}"></span>` : ""}<span class="ntrow">${G.sevChip(a.severity)} <b>${E(i.headline)}</b></span>`
      + `<span class="meta">${a.districts.length ? E(a.districts.map(dn).join(", ")) : L("देशभर", "Nationwide")} · ${L("स्रोत", "Source")}: ${E((i.senderName || "").split(" · ")[0])} · ${L("स्रोतको समय", "Source time")}: ${G.npt(i.params["gati:sourceTime"] || a.sent)}</span></a></li>`; };

  async function list() { const box = $("nt-list"), ib = await G.inbox();
    let al = []; try { al = (await G.json("data/alerts.json")).alerts || []; } catch (e) {}
    const D = ib.D, p = G.notifPrefs();
    const old = al.filter((a) => (Date.parse(a.expires) <= Date.now() || a.supersededBy || a.msgType === "Cancel") && (a.info.en.params || {})["gati:demo"] !== "true")
      .filter((a) => (a.districts.length ? a.districts.some((c) => D.includes(c)) : p.nation)).sort((x, y) => (y.sent > x.sent ? 1 : -1));
    const mine = ib.items.filter((a) => a.mine), nat = ib.items.filter((a) => !a.mine);
    box.innerHTML = `<div class="nthead"><p class="meta">${D.length ? `${L("हजुरका जिल्ला", "Your districts")}: ${E(D.map(dn).join(", "))}` : L("कुनै जिल्ला छानिएको छैन; तल सेटिङमा जिल्ला थप्नुहोस्।", "No district chosen yet; add one in the settings below.")}</p>
      ${ib.unread ? `<button type="button" class="btn ntbtn" id="ntread">${L("सबै पढिसकेँ", "Mark all as read")} (${G.num(String(ib.unread))})</button>` : ""}</div>
      ${mine.length ? `<h3>${L("हजुरका जिल्लाका चालु सूचना", "Active in your districts")}</h3><ul class="ntlist">${mine.map((a) => item(a, a.unread)).join("")}</ul>` : ""}
      ${nat.length ? `<h3>${D.length ? L("अन्य चालु सूचना", "Other active alerts") : L("चालु सूचना", "Active alerts")}</h3><ul class="ntlist">${nat.map((a) => item(a, a.unread)).join("")}</ul>` : ""}
      ${ib.items.length ? "" : `<p class="ntempty">${L("हजुरका छनोटसँग मिल्ने कुनै चालु सूचना छैन। यसको अर्थ खतरा छैन भन्ने होइन।", "No active alert matches your choices. This is not an all clear.")}</p>`}
      <details class="ntarch"><summary>${L("अभिलेख: सकिएका वा बदलिएका सूचना", "Archive: expired or replaced alerts")} (${G.num(String(old.length))})</summary>
        ${old.length ? `<ul class="ntlist">${old.slice(0, 40).map((a) => item(a, false)).join("")}</ul>` : `<p class="meta">${L("अहिले केही छैन।", "Nothing yet.")}</p>`}
        <p class="meta"><a href="${R}alerts/">${L("पूरा अभिलेख हेर्नुहोस्", "See the full archive")}</a></p></details>`;
    const rb = $("ntread"); if (rb) rb.onclick = () => { G.markNotifSeen(); try { localStorage.setItem("gati-notif-read", "[]"); } catch (e) {} list(); };
    box.querySelectorAll("a[data-id]").forEach((a) => a.addEventListener("click", () => markRead(a.dataset.id)));
    if (G.markDot) G.markDot();
  }

  async function settings() { const box = $("nt-set"), p = G.notifPrefs(), w = getW(), D = w.d || [];
    const perm = "Notification" in window ? Notification.permission : "unsupported", on = G.push && G.push.on();
    const canVib = "vibrate" in navigator, my = G.district && G.district.get && G.district.get();
    box.innerHTML = `<section class="ntc"><h3>${L("ब्राउजर सूचना", "Browser notifications")}</h3>
      <p>${perm === "unsupported" ? `<span class="meta">${L("यो ब्राउजरमा उपलब्ध छैन।", "Not available in this browser.")}</span>` : perm === "denied" ? `<span class="meta">${L("ब्राउजरमा रोकिएको छ; ब्राउजर सेटिङबाट खोल्नुहोस्।", "Blocked in the browser; allow it from browser settings.")}</span>`
        : `<button type="button" class="btn ntbtn" id="ntlocal" aria-pressed="${p.local && perm === "granted"}">${p.local && perm === "granted" ? L("बन्द गर्नुहोस्", "Turn off") : L("खोल्नुहोस्", "Turn on")}</button> <button type="button" class="fopt" id="nttest"${perm === "granted" ? "" : " disabled"}>${L("परीक्षण सूचना", "Test notification")}</button>`}</p>
      <p class="meta">${L("हजुरले थिचेपछि मात्र अनुमति माग्छ। गति खुला भएको बेला मात्र सूचना देखाउँछ। गति बन्द हुँदा आउने सूचना (पुस) अझै सुरु भएको छैन।", "Permission is asked only when you tap. Notifications show only while Gati is open. Notifications while Gati is closed (push) are not available yet.")}</p>
      ${perm !== "unsupported" ? `<label class="ftog"><input type="checkbox" id="ntsnd"${p.snd ? " checked" : ""}> ${L("आवाज", "Sound")}</label>${canVib ? ` <label class="ftog"><input type="checkbox" id="ntvib"${p.vib ? " checked" : ""}> ${L("कम्पन", "Vibration")}</label>` : ""}` : ""}
      <p class="meta" id="ntmsg" role="status"></p></section>
    <section class="ntc"><h3>${L("जिल्ला", "Districts")}</h3>
      ${my ? `<p class="meta">${L("मेरो जिल्ला", "My district")}: <b>${E(dn(my))}</b> · <a href="${R}me/#place">${L("बदल्नुहोस्", "Change")}</a></p>` : ""}
      <div class="fopts">${D.map((c) => `<button type="button" class="fopt" aria-pressed="true" data-rm="${E(c)}" aria-label="${E(dn(c))}: ${L("हटाउनुहोस्", "remove")}">${E(dn(c))} ✕</button>`).join("")}</div>
      <p class="ntq"><label class="sr-only" for="ntadd">${L("जिल्ला थप्नुहोस्", "Add a district")}</label><select id="ntadd"><option value="">${L("जिल्ला थप्नुहोस्", "Add a district")}</option>${DL.filter((d) => !D.includes(d.code) && d.code !== my).map((d) => `<option value="${E(d.code)}">${E(L(d.ne, d.en))}</option>`).join("")}</select></p>
      <label class="ftog"><input type="checkbox" id="ntnat"${p.nation ? " checked" : ""}> ${L("देशभरका सूचना पनि", "Also nationwide alerts")}</label></section>
    <section class="ntc"><h3>${L("प्रकार", "Category")} <span class="meta">(${L("कुनै नछाने सबै", "none chosen means all")})</span></h3><div class="fopts">${HZ.map(([k, ne, en]) => `<button type="button" class="fopt" data-hz="${k}" aria-pressed="${p.hz.includes(k)}">${L(ne, en)}</button>`).join("")}</div>
      <h3>${L("न्यूनतम गम्भीरता", "Minimum severity")}</h3><div class="fopts">${SV.map((k) => `<button type="button" class="fopt" data-min="${k}" aria-pressed="${p.min === k}">${G.sevChip(k)}</button>`).join("")}</div></section>
    <section class="ntc"><h3>${L("शान्त समय (नेपाली समय)", "Quiet hours (NPT)")}</h3><p class="ntq"><input type="time" id="ntqf" value="${E(p.qf)}" aria-label="${L("देखि", "From")}"> ${L("देखि", "to")} <input type="time" id="ntqt" value="${E(p.qt)}" aria-label="${L("सम्म", "Until")}"> ${L("सम्म", "")}</p>
      <p class="meta">${L("शान्त समयमा ब्राउजर सूचना देखाइँदैन; सूची भने यहीँ रहन्छ।", "During quiet hours no browser notification is shown; the list here still updates.")}</p></section>
    ${on ? `<section class="ntc"><h3>${L("पृष्ठभूमि पुस (परीक्षणमा)", "Background push (in testing)")}</h3><button type="button" class="btn ntbtn" id="ntgo">${L("सदस्यता लिनुहोस्", "Subscribe")}</button></section>` : ""}
    <p class="meta">${L("सूचना पाउने अर्को तरिका", "Another way to get alerts")}: <a href="${R}atom.xml">CAP Atom feed</a> · <a href="${R}feed.xml">RSS</a></p>`;
    const all = () => Promise.all([list(), settings()]);
    const upd = (f) => { const q = G.notifPrefs(); f(q); G.saveNotifPrefs(q); all(); }, msg = (t) => { const m = $("ntmsg"); if (m) m.textContent = t; };
    box.querySelectorAll("[data-hz]").forEach((b) => (b.onclick = () => upd((q) => { const k = b.dataset.hz; q.hz = q.hz.includes(k) ? q.hz.filter((x) => x !== k) : q.hz.concat(k); })));
    box.querySelectorAll("[data-min]").forEach((b) => (b.onclick = () => upd((q) => (q.min = b.dataset.min))));
    box.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = () => { const x = getW(); x.d = (x.d || []).filter((c) => c !== b.dataset.rm); setW(x); all(); }));
    $("ntadd").onchange = (e) => { if (!e.target.value) return; const x = getW(); x.d = (x.d || []).concat(e.target.value); setW(x); all(); };
    $("ntnat").onchange = (e) => upd((q) => (q.nation = e.target.checked));
    ["ntsnd", "ntvib"].forEach((id) => { const el = $(id); if (el) el.onchange = (e) => upd((q) => (q[id === "ntsnd" ? "snd" : "vib"] = e.target.checked)); });
    ["ntqf", "ntqt"].forEach((id) => ($(id).onchange = (e) => { const q = G.notifPrefs(); q[id === "ntqf" ? "qf" : "qt"] = e.target.value; G.saveNotifPrefs(q); }));
    const lc = $("ntlocal"); if (lc) lc.onclick = async () => { const q = G.notifPrefs();
      if (q.local && Notification.permission === "granted") { q.local = false; G.saveNotifPrefs(q); return settings(); }
      const r = await Notification.requestPermission(); if (r !== "granted") { msg(L("अनुमति दिइएन", "Permission not given")); return; }
      q.local = true; G.saveNotifPrefs(q); try { const { items } = await G.inbox(); localStorage.setItem(G.NDONE, JSON.stringify(items.map((a) => a.identifier))); } catch (e) {} settings(); };
    const ts = $("nttest"); if (ts) ts.onclick = async () => { const q = G.notifPrefs(), reg = "serviceWorker" in navigator && (await navigator.serviceWorker.getRegistration());
      const t = L("गति परीक्षण सूचना", "Gati test notification"), bd = L("यो परीक्षण मात्र हो। वास्तविक सूचनामा स्रोत र स्रोतको समय हुन्छ।", "This is only a test. Real notifications show the source and source time.");
      const o = { body: bd, tag: "gati-test", silent: !q.snd, vibrate: q.vib ? [200, 100, 200] : [], data: { url: R + "notifications/" }, icon: R + "assets/img/brand/favicon-64.png" };
      if (reg) reg.showNotification(t, o); else new Notification(t, o); msg(L("परीक्षण सूचना पठाइयो", "Test notification sent")); };
    const go = $("ntgo"); if (go) go.onclick = async () => { const r = await G.push.subscribe(my || D[0] || ""); msg(r.msg); };
  }
  let last = G.lang; const all = () => Promise.all([list(), settings()]).catch(() => {});
  G.onLang((l) => { if (l !== last) { last = l; all(); } });
  G.json("data/districts.json").then((d) => { DL = d || []; }).catch(() => {}).then(all);
})();
