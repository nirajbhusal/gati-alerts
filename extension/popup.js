/* Popup: active alerts for the chosen district, DHM's 5-day strip and quick links. */
(async function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const DEV = "०१२३४५६७८९";
  let st = await getStore(["district", "notify", "lang", "theme"]);
  let theme = ["auto", "light", "dark"].includes(st.theme) ? st.theme : "auto";
  const applyTheme = () => { document.documentElement.dataset.theme = theme; try { localStorage.setItem("gati-theme", theme); } catch (e) {} };
  applyTheme();
  let lang = st.lang === "en" ? "en" : "ne", district = st.district || "", DATA = null, WX = null, err = "";
  const T = (ne, en) => (lang === "ne" ? ne : en), N = (v) => (lang === "ne" ? String(v).replace(/\d/g, (d) => DEV[d]) : String(v));
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], MONN = ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"];
  /* always Nepal time, whatever the computer's clock is set to */
  const npt = (iso) => { const d = new Date(Date.parse(iso) + 345 * 60000); let h = d.getUTCHours(); const m = String(d.getUTCMinutes()).padStart(2, "0"), ap = h >= 12 ? "PM" : "AM"; const h12 = h % 12 || 12;
    return lang === "ne" ? N(`${MONN[d.getUTCMonth()]} ${d.getUTCDate()}, ${h}:${m}`) : `${d.getUTCDate()} ${MON[d.getUTCMonth()]}, ${h12}:${m} ${ap}`; };
  const LV = { green: ["चेतावनी छैन", "No warning", "#2E8B57"], yellow: ["अद्यावधिक", "Be updated", "#E5B800"], orange: ["सतर्क", "Be prepared", "#F28C1E"], red: ["कारबाही", "Take action", "#D93025"] };

  function card(a) { const i = a.info[lang] || a.info.ne || a.info.en, s = SEV[a.severity] || SEV.Unknown;
    return `<a class="al" style="--c:${s[2]}" href="${SITE}alerts/${encodeURIComponent(a.identifier)}/" target="_blank" rel="noopener"><b>${esc(i.headline)}</b>
      <span class="m"><span class="chip">${T(s[0], s[1])}</span><span class="tr">${a.trust === "Official" ? T("🛡 आधिकारिक", "🛡 Official") : T("✓ प्रमाणित", "✓ Verified")}</span><span>${esc(agencyOf(a, lang))}</span><span>${npt(a.sent)} NPT</span></span></a>`; }

  function draw() {
    document.documentElement.lang = lang;
    $("home").href = SITE; $("lang").textContent = lang === "ne" ? "English" : "नेपाली";
    const TH = { auto: ["◐ स्वचालित", "◐ Auto"], light: ["☀ उज्यालो", "☀ Light"], dark: ["☾ अँध्यारो", "☾ Dark"] };
    $("theme").textContent = T(TH[theme][0], TH[theme][1]); $("theme").title = T("रङ: स्वचालित, उज्यालो वा अँध्यारो", "Colours: automatic, light or dark"); $("theme").setAttribute("aria-label", $("theme").title + ": " + T(TH[theme][0], TH[theme][1]).slice(2));
    $("dlabel").textContent = T("मेरो जिल्ला", "My district");
    $("district").innerHTML = `<option value="">${T("सबै नेपाल", "All Nepal")}</option>` + DISTRICTS.map((d) => `<option value="${d[0]}"${d[0] === district ? " selected" : ""}>${esc(lang === "ne" ? d[1] : d[2])}</option>`).join("");
    $("nlabel").textContent = T("नयाँ सूचना आउँदा जानकारी दिनुहोस्", "Notify me of new alerts"); $("notify").checked = !!st.notify;
    $("refresh").textContent = T("ताजा गर्नुहोस्", "Refresh");
    const L = $("list");
    if (!DATA) L.innerHTML = err ? `<p class="err">${T("गतिबाट जानकारी ल्याउन सकिएन। इन्टरनेट जाँच्नुहोस्।", "Could not reach Gati. Check your connection.")}</p>` : `<p class="ok">${T("लोड हुँदै…", "Loading…")}</p>`;
    else { const all = activeAlerts(DATA, district), local = all.filter(named), nation = all.filter((a) => !named(a));
      const dn = district ? DISTRICTS.find((d) => d[0] === district) : null, where = dn ? (lang === "ne" ? dn[1] : dn[2]) : T("नेपाल", "Nepal");
      L.innerHTML = (local.length ? `<p class="h">${T(where + ": सक्रिय सूचना", "Active alerts: " + where)} (${N(local.length)})</p>` + local.slice(0, 6).map(card).join("")
          : `<p class="ok"><b>${T(where + "मा अहिले जिल्ला तोकिएको सक्रिय सूचना छैन", "No active alert names " + where + " right now")}</b>${T("आधिकारिक निकायले जारी नगरेसम्म गतिले केही देखाउँदैन।", "Gati shows nothing until an official agency issues it.")}</p>`)
        + (local.length > 6 ? `<p class="src"><a href="${SITE}alerts/" target="_blank" rel="noopener">${T("सबै सूचना हेर्नुहोस्", "See all alerts")} →</a></p>` : "")
        + (nation.length ? `<p class="h">${T("देशभरका बुलेटिन", "Nationwide bulletins")}</p>` + nation.slice(0, 2).map(card).join("") : ""); }
    const W = $("wx"), b5 = WX && WX.bulletin5;
    if (b5 && b5.days) { W.hidden = false;
      W.innerHTML = `<p class="h">${T("DHM · ५ दिने मौसम चेतावनी", "DHM · 5-day weather warning")}</p><div class="days">${b5.days.slice(0, 5).map((d) => { const v = LV[d.level] || LV.green; return `<div class="day" style="--c:${v[2]}"><b>${N(Number(d.ad.slice(8)))} ${lang === "ne" ? MONN[Number(d.ad.slice(5, 7)) - 1].slice(0, 3) : MON[Number(d.ad.slice(5, 7)) - 1]}</b>${T(v[0], v[1])}</div>`; }).join("")}</div>
        <p class="src">${T("स्रोत", "Source")}: <a href="${esc(b5.url)}" target="_blank" rel="noopener">DHM ↗</a> · ${T("जारी", "issued")} ${npt(b5.issued)} NPT</p>`; } else W.hidden = true;
    $("links").innerHTML = [["map/", T("नक्सा", "Map")], ["roads/", T("सडक", "Roads")], ["flights/", T("उडान", "Flights")], ["contacts/", T("आपतकालीन", "Emergency"), "sos"]].map((l) => `<a href="${SITE}${l[0]}" target="_blank" rel="noopener"${l[2] ? ' class="sos"' : ""}>${l[1]}</a>`).join("");
    $("foot").innerHTML = T("गतिले आधिकारिक निकायका सूचना स्रोत र समयसहित प्रसारण मात्र गर्छ; आफैँ चेतावनी जारी गर्दैन। आपत्कालमा १००, १०१, १०२ वा १२३४।", "Gati only relays official agencies' notices with source and time; it does not issue warnings. In an emergency call 100, 101, 102 or 1234.")
      + (DATA && DATA.generated ? ` ${T("अद्यावधिक", "Updated")} ${npt(DATA.generated)} NPT.` : "");
  }

  $("theme").onclick = async () => { theme = theme === "auto" ? "light" : theme === "light" ? "dark" : "auto"; applyTheme(); await setStore({ theme }); draw(); };
  $("lang").onclick = async () => { lang = lang === "ne" ? "en" : "ne"; await setStore({ lang }); draw(); };
  $("district").onchange = async (e) => { district = e.target.value; await setStore({ district }); draw(); chrome.runtime.sendMessage("check"); };
  $("notify").onchange = async (e) => { st.notify = e.target.checked; await setStore({ notify: st.notify }); };
  $("refresh").onclick = () => load(true);
  async function load(ping) { err = "";
    try { [DATA, WX] = await Promise.all([loadJson("data/alerts.json"), loadJson("data/weather.json").catch(() => null)]); } catch (e) { err = String(e); }
    draw(); if (ping) chrome.runtime.sendMessage("check"); }
  draw(); load(true);
})();
