/* Shared by the popup and the background worker. No data leaves the browser: the extension only reads
   Gati's public files and keeps the chosen district, language and seen alerts in chrome.storage. */
const SITE = "https://nirajbhusal.github.io/gati-alerts/";
const SEV = { Extreme: ["अत्यन्त गम्भीर", "Extreme", "#B3261E", 4], Severe: ["गम्भीर", "Severe", "#E8590C", 3], Moderate: ["मध्यम", "Moderate", "#F28C1E", 2], Minor: ["सामान्य", "Minor", "#E5B800", 1], Unknown: ["जानकारी", "Info", "#6B7280", 0] };
const AGENCY = { "hydrology.gov.np": "DHM", "dhm.gov.np": "DHM", "ndrrma.gov.np": "NDRRMA", "neoc.moha.gov.np": "NEOC", "nepalpolice.gov.np": ["नेपाल प्रहरी", "Nepal Police"], "bipadportal.gov.np": "BIPAD", "seismonepal.gov.np": "NSC", "earthquake.usgs.gov": "USGS", "nirajbhusal.github.io": ["गति (प्रमाणित)", "Gati (verified)"] };

/* An alert counts when it is still in force, has not been replaced, and is Official or Verified.
   Citizen reports that are only "Reported" never reach the extension. */
function activeAlerts(data, district) {
  const now = Date.now();
  return (data && data.alerts ? data.alerts : [])
    .filter((a) => (a.trust === "Official" || a.trust === "Verified") && a.msgType !== "Cancel" && !a.supersededBy && Date.parse(a.expires) > now)
    .filter((a) => !district || !a.districts || !a.districts.length || a.districts.includes(district))
    .sort((x, y) => (SEV[y.severity] || SEV.Unknown)[3] - (SEV[x.severity] || SEV.Unknown)[3] || (y.sent > x.sent ? 1 : -1));
}
/* Nationwide bulletins name no district; they are listed but do not raise the badge on their own. */
const named = (a) => a.districts && a.districts.length > 0;
const agencyOf = (a, lang) => { const v = AGENCY[a.sender] || a.sender; return Array.isArray(v) ? v[lang === "ne" ? 0 : 1] : v; };
async function loadJson(path) { const r = await fetch(SITE + path, { cache: "no-store" }); if (!r.ok) throw new Error(path + " " + r.status); return r.json(); }
const getStore = (keys) => new Promise((res) => chrome.storage.local.get(keys, res));
const setStore = (obj) => new Promise((res) => chrome.storage.local.set(obj, res));
