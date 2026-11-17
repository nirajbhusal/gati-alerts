/* Page totals and one-tap feedback, without tracking anyone.
   Sends only the page's path (and, for a few actions, the action's name) to Gati's own Worker, which keeps totals
   per page per day. No cookies, no identifiers, nothing about the device. Not sent at all when the browser asks not
   to be tracked (Do Not Track or Global Privacy Control), or when the Worker does not offer it.
   The feedback row ("Useful / Unclear / Wrong") appears only once the Worker has answered. */
(async function () {
  const G = window.Gati; if (!G || G.pulse) return;
  const T = (ne, en) => (G.lang === "ne" ? ne : en), page = document.body.dataset.page || "";
  G.pulse = { track: () => {} };
  const dnt = navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true;
  let base = ""; try { const c = await G.rawJson("data/ask-config.json"); base = c && c.worker ? String(c.worker).replace(/\/ask\/?$/, "") : ""; } catch (e) {}
  if (!base || !/^https:\/\//.test(base)) return;
  const path = location.pathname;
  const send = (route, body) => fetch(base + route, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(body), keepalive: true, credentials: "omit", referrerPolicy: "no-referrer" });
  let live = false, seen = ""; try { seen = sessionStorage.getItem("gati-pulse") || ""; } catch (e) {}
  if (seen === "0") return;   /* the Worker did not offer it earlier in this session: ask again next session, not on every page */
  if (!dnt) {
    try { const r = await send("/hit", { p: path }); live = r.status === 204; try { sessionStorage.setItem("gati-pulse", live ? "1" : "0"); } catch (e) {} } catch (e) { live = false; }
    if (live) G.pulse.track = (e) => { send("/hit", { p: path, e }).catch(() => {}); };
  } else {
    /* no counting; feedback is still offered, because pressing a button is the visitor's own choice */
    try { const r = await fetch(base + "/stats?days=1", { credentials: "omit", referrerPolicy: "no-referrer" }); live = r.ok; } catch (e) { live = false; }
    try { sessionStorage.setItem("gati-pulse", live ? "1" : "0"); } catch (e) {}
  }
  const main = document.getElementById("main");
  if (!live || !main || ["stories", "embed", "map"].includes(page)) return;
  const box = document.createElement("section"); box.className = "pfb"; box.setAttribute("aria-label", "प्रतिक्रिया · Feedback");
  const V = [["useful", "उपयोगी", "Useful"], ["unclear", "अस्पष्ट", "Unclear"], ["wrong", "गलत", "Wrong"]];
  let done = false, picked = "";
  function draw() {
    if (done) { box.innerHTML = `<p class="pfbq" role="status">${T("धन्यवाद। यसले गतिलाई सुधार्न मद्दत गर्छ।", "Thank you. This helps improve Gati.")}</p>`; return; }
    box.innerHTML = `<p class="pfbq">${T("यो पृष्ठ कस्तो लाग्यो?", "How was this page?")}</p><div class="pfbb" role="group">${V.map(([v, ne, en]) => `<button type="button" class="pfbbtn${picked === v ? " on" : ""}" data-v="${v}" aria-pressed="${picked === v}">${T(ne, en)}</button>`).join("")}</div>`
      + (picked && picked !== "useful" ? `<form class="pfbn"><label for="pfbt">${picked === "wrong" ? T("के गलत छ? (ऐच्छिक)", "What is wrong? (optional)") : T("के अस्पष्ट छ? (ऐच्छिक)", "What is unclear? (optional)")}</label><input id="pfbt" type="text" maxlength="200" autocomplete="off"><button type="submit" class="pfbbtn pfbsend">${T("पठाउनुहोस्", "Send")}</button><small>${T("नाम, फोन वा इमेल नलेख्नुहोस्। पृष्ठको ठेगाना र यो टिप्पणी मात्र पठाइन्छ।", "Do not write a name, phone or email. Only the page address and this note are sent.")}</small></form>` : "");
    box.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { picked = b.dataset.v; if (picked === "useful") go(""); else { draw(); const i = box.querySelector("#pfbt"); if (i) i.focus(); } }));
    const f = box.querySelector("form"); if (f) f.onsubmit = (e) => { e.preventDefault(); go(box.querySelector("#pfbt").value.trim()); };
  }
  async function go(note) {
    try { const r = await send("/fb", { p: path, v: picked, note, lang: G.lang === "ne" ? "ne" : "en" }); if (r.status !== 204) throw 0; done = true; draw(); }
    catch (e) { const m = document.createElement("p"); m.className = "pfberr"; m.setAttribute("role", "alert"); m.textContent = T("अहिले पठाउन सकिएन। पछि फेरि प्रयास गर्नुहोस्।", "Could not send right now. Please try again later."); const old = box.querySelector(".pfberr"); if (old) old.remove(); box.append(m); }
  }
  draw(); G.onLang(draw);
  const share = main.querySelector(":scope > .pgshare"); if (share) share.before(box); else main.append(box);
})();
