/* Citizen report → prefilled GitHub issue form (no backend, no secrets). */
(async function () {
  const G = window.Gati, $ = (id) => document.getElementById(id);
  const REPO = "https://github.com/nirajbhusal/gati-alerts";
  // Option values must match .github/ISSUE_TEMPLATE/report.yml exactly.
  const HAZ = ["बाढी / Flood", "पहिरो / Landslide", "सडक अवरोध / Road blocked", "पुल क्षति / Bridge damage", "भारी वर्षा / Heavy rain",
    "हिमताल/हिमपहिरो / Glacial lake or avalanche", "भूकम्प / Earthquake", "आगलागी / Fire", "बिजुली/सञ्चार अवरोध / Power or telecom outage", "अन्य / Other"];
  const districts = await G.json("data/districts.json");
  function fill() {
    const hv = $("hazard").value, dv = $("district").value;
    const pick = (s) => (G.lang === "ne" ? s.split(" / ")[0] : s.split(" / ")[1]);
    $("hazard").innerHTML = `<option value="">—</option>` + HAZ.map((h) => `<option value="${h}">${pick(h)}</option>`).join("");
    const nm = (d) => (G.lang === "ne" ? d.ne : d.en);
    $("district").innerHTML = `<option value="">—</option>` + [...districts].sort((a, b) => nm(a).localeCompare(nm(b), G.lang))
      .map((d) => `<option value="${d.id}">${G.esc(nm(d))}</option>`).join("");
    $("hazard").value = hv; $("district").value = dv;
  }
  fill(); G.onLang(fill);
  const pad = (n) => String(n).padStart(2, "0"), n = new Date();
  $("when").value = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;

  let marker, map;
  const setPin = (la, lo, fly) => {
    la = +la.toFixed(4); lo = +lo.toFixed(4);
    $("latlon").value = `${la}, ${lo}`;
    if (!map) return;
    if (!marker) { marker = L.marker([la, lo], { draggable: true }).addTo(map);
      marker.on("dragend", () => { const p = marker.getLatLng(); setPin(p.lat, p.lng); }); }
    else marker.setLatLng([la, lo]);
    if (fly) map.setView([la, lo], 14);
  };
  if (window.L) {
    map = L.map("pickmap").setView([28.2, 84.1], 6);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    map.on("click", (e) => setPin(e.latlng.lat, e.latlng.lng));
  }
  $("latlon").addEventListener("change", () => { const m = $("latlon").value.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/); if (m) setPin(+m[1], +m[3], true); });
  $("gps").onclick = () => {
    if (!navigator.geolocation) return;
    $("gps").disabled = true;
    navigator.geolocation.getCurrentPosition((p) => { setPin(p.coords.latitude, p.coords.longitude, true); $("gps").disabled = false; },
      () => { $("gps").disabled = false; alert(G.lang === "ne" ? "GPS पाउन सकिएन। नक्सामा थिच्नुहोस्।" : "Could not get GPS. Tap the map instead."); },
      { enableHighAccuracy: true, timeout: 15000 });
  };
  $("photo").onchange = () => { const f = $("photo").files[0]; const im = $("preview");
    if (f) { im.src = URL.createObjectURL(f); im.style.display = "block"; } else im.style.display = "none"; };

  $("rf").onsubmit = (e) => {
    e.preventDefault();
    const miss = [];
    if (!$("hazard").value) miss.push(G.lang === "ne" ? "जोखिमको प्रकार" : "hazard type");
    if (!$("district").value) miss.push(G.lang === "ne" ? "जिल्ला" : "district");
    if (!$("desc").value.trim()) miss.push(G.lang === "ne" ? "विवरण" : "description");
    if (!$("consent").checked) miss.push(G.lang === "ne" ? "सहमति" : "consent");
    if (miss.length) { $("err").hidden = false; $("err").textContent = (G.lang === "ne" ? "कृपया भर्नुहोस्: " : "Please complete: ") + miss.join(", "); return; }
    $("err").hidden = true;
    const d = districts.find((x) => x.id === $("district").value);
    const haz = $("hazard").value, when = $("when").value;
    const title = `[Report] ${haz.split(" / ")[1]} — ${d.en}${$("municipality").value ? ", " + $("municipality").value : ""}`;
    const q = new URLSearchParams({
      template: "report.yml", title, labels: "reported,citizen-report",
      hazard: haz, district: `${d.ne} / ${d.en}`, municipality: $("municipality").value.trim(), ward: $("ward").value.trim(),
      place: $("place").value.trim(), gps: $("latlon").value.trim(), observed: when ? when.replace("T", " ") + " NPT" : "",
      description: $("desc").value.trim(),
    });
    const url = `${REPO}/issues/new?${q}`;
    window.open(url, "_blank", "noopener");
    const c = $("contact").value.trim();
    const mail = `mailto:neerajbhusal@gmail.com?subject=${encodeURIComponent("Gati report contact: " + title)}&body=${encodeURIComponent("Private contact for my Gati report (please do not publish):\n" + c + "\n\nReport title: " + title)}`;
    $("done").hidden = false;
    $("done").innerHTML = G.lang === "ne"
      ? `<p><strong>GitHub नयाँ ट्याबमा खुल्यो।</strong> त्यहाँ विवरण जाँचेर "Create" थिच्नुहोस्। ${$("photo").files[0] ? "तस्विर विवरण बाकसमा तान्न नबिर्सनुहोस्।" : ""} खुलेन भने <a href="${G.esc(url)}" target="_blank" rel="noopener">यहाँ थिच्नुहोस्</a>।</p>${c ? `<p>सम्पर्क निजी रूपमा पठाउन: <a class="btn alt" href="${G.esc(mail)}">✉ इमेलबाट मोडेरेटरलाई मात्र</a></p>` : ""}`
      : `<p><strong>GitHub opened in a new tab.</strong> Check the details there and press "Create". ${$("photo").files[0] ? "Remember to drag your photo into the description box." : ""} If nothing opened, <a href="${G.esc(url)}" target="_blank" rel="noopener">click here</a>.</p>${c ? `<p>To share your contact privately: <a class="btn alt" href="${G.esc(mail)}">✉ Email the moderator only</a></p>` : ""}`;
    $("done").scrollIntoView({ behavior: "smooth" });
  };
})();
