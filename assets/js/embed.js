/* Gati embed widget. ?district=<slug|NP-DISTRICT code>&size=s|m|l&lang=ne|en
   Shows active, non-superseded items only, each with severity, trust label, original source link and source time. */
(function () {
  const q = new URLSearchParams(location.search);
  const lang = q.get("lang") === "en" ? "en" : "ne", size = ["s", "m", "l"].includes(q.get("size")) ? q.get("size") : "m";
  const MAX = { s: 1, m: 3, l: 6 }[size];
  document.documentElement.lang = lang; document.getElementById("w").classList.add(size);
  const T = (n, e) => (lang === "ne" ? n : e);
  const DEV = "०१२३४५६७८९", num = (s) => (lang === "ne" ? String(s).replace(/\d/g, (d) => DEV[d]) : String(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MN = ["जनवरी","फेब्रुअरी","मार्च","अप्रिल","मे","जुन","जुलाई","अगस्ट","सेप्टेम्बर","अक्टोबर","नोभेम्बर","डिसेम्बर"], ME = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const npt = (iso) => { const d = new Date(new Date(iso).getTime() + 345 * 60000); let h = d.getUTCHours(); const mi = String(d.getUTCMinutes()).padStart(2, "0");
    if (lang === "ne") return num(`${MN[d.getUTCMonth()]} ${d.getUTCDate()}, ${h}:${mi}`) + " NPT";
    const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return `${d.getUTCDate()} ${ME[d.getUTCMonth()]}, ${h}:${mi} ${ap} NPT`; };
  const SEV = { Extreme: ["अत्यन्त गम्भीर", "Extreme", "⬢", "#8E1B14"], Severe: ["गम्भीर", "Severe", "▲", "#D93025"], Moderate: ["मध्यम", "Moderate", "◆", "#F28C1E"],
    Minor: ["सामान्य", "Minor", "●", "#9a7b00"], Unknown: ["सूचना", "Info", "ℹ", "#2F6FED"] };
  const TR = { Official: ["🛡 आधिकारिक", "🛡 Official"], Verified: ["✓ प्रमाणित", "✓ Verified"], Reported: ["❝ रिपोर्ट गरिएको", "❝ Reported"] };
  const site = "https://nirajbhusal.github.io/gati-alerts/";
  document.getElementById("disc").textContent = T("गतिले आधिकारिक स्रोत मात्र प्रसारण गर्छ", "Gati relays official sources");
  Promise.all([fetch("../data/alerts.json").then((r) => r.json()), fetch("../data/districts.json").then((r) => r.json())]).then(([data, D]) => {
    const dq = q.get("district"), d = dq && D.find((x) => x.id === dq || x.code === dq);
    document.getElementById("dn").textContent = d ? (lang === "ne" ? d.ne : d.en) : T("सबै नेपाल", "All Nepal");
    const now = Date.now();
    const act = data.alerts.filter((a) => new Date(a.expires) > now && !a.supersededBy && a.msgType !== "Cancel" && (!d || !a.districts.length || a.districts.includes(d.code)))
      .sort((x, y) => Object.keys(SEV).indexOf(x.severity) - Object.keys(SEV).indexOf(y.severity) || y.sent.localeCompare(x.sent));
    const ls = document.getElementById("ls");
    if (d) document.getElementById("badge").href = site + "?district=" + d.id;
    if (!act.length) { ls.innerHTML = `<li class="empty">${T("अहिले यहाँका लागि गतिमा कुनै चालु सूचना छैन। यसको अर्थ खतरा छैन भन्ने होइन; DHM, NDRRMA र स्थानीय प्रशासनका सूचना पनि हेर्नुहोस्।", "No active item in Gati for this area right now. That does not mean there is no risk; also check DHM, NDRRMA and local administration.")}</li>`; return; }
    ls.innerHTML = act.slice(0, MAX).map((a) => { const i = a.info[lang], s = SEV[a.severity] || SEV.Unknown, t = TR[a.trust];
      const st = i.params["gati:sourceTime"] || a.sent;
      return `<li class="it" style="border-left-color:${s[3]}"><span class="chip" style="background:${s[3]}">${s[2]} ${T(s[0], s[1])}</span>${t ? `<span class="tr">${T(...t)}</span>` : ""}
        <h3><a href="${site}alerts/${esc(a.identifier)}/" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${esc(i.headline)}</a></h3>
        <p class="m" style="margin:0">${T("स्रोत", "Source")}: <a href="${esc(i.web)}" target="_blank" rel="noopener">${esc(i.senderName.split(" — ")[0].split(" · ")[0])}</a> · ${npt(st)}</p></li>`; }).join("") +
      (act.length > MAX ? `<li class="m"><a href="${site}${d ? "?district=" + d.id : ""}" target="_blank" rel="noopener">${T(`थप ${num(act.length - MAX)} सूचना हेर्नुहोस्`, `${act.length - MAX} more`)}</a></li>` : "");
  }).catch(() => { document.getElementById("ls").innerHTML = `<li class="empty">${T("सूचना खुलेन।", "Could not load.")}</li>`; });
})();
