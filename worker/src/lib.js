/* Pure helpers for the Ask Gati Worker (unit-tested in test/lib.test.mjs). Gati relays official sources, never issues. */
export const FILES = ["data/alerts.json", "data/roads.json", "data/rivers.json", "data/arnab-advisory.json", "data/travel-advisory.json", "data/trek-permits.json", "data/contacts.json", "data/geo/treks.geojson", "data/source-health.json"];
const AG = { "hydrology.gov.np": "DHM", "ndrrma.gov.np": "NDRRMA", "nepalpolice.gov.np": "Nepal Police", "seismonepal.gov.np": "NSC", "dor.gov.np": "DoR" };

export function corsHeaders(origin, allowed) {
  const ok = allowed.split(",").map((s) => s.trim()).includes(origin);
  return ok ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" } : null;
}
export const isNepali = (q) => /[\u0900-\u097F]/.test(q);
export function validQuestion(q, max) { if (typeof q !== "string") return "missing"; const t = q.trim(); if (!t) return "empty"; if (t.length > max) return "too_long"; return null; }

/* Build a compact list of citable items. Each gets a short id (A1, R1...) the model must cite; the Worker maps ids back to real links, so citations cannot be invented. */
const cut = (t, n = 160) => { t = String(t || ""); if (t.length <= n) return t; const s = t.slice(0, n), k = Math.max(s.lastIndexOf(". "), s.lastIndexOf("। ")); return k > 60 ? s.slice(0, k + 1) : s.replace(/\s+\S*$/, "") + "…"; };
export function buildItems(D, now = Date.now()) {
  const items = [], add = (o) => { items.push(o); return o; };
  const al = (D["data/alerts.json"] || {}).alerts || [];
  al.filter((a) => !a.supersededBy && Date.parse(a.expires || "2999-01-01") > now && (a.info.en.params || {})["gati:demo"] !== "true").forEach((a, i) => {
    const e = a.info.en, n = a.info.ne || {};
    add({ id: "A" + (i + 1), kind: "alert", agency: AG[a.sender] || a.sender, trust: a.trust, severity: a.severity, hazard: a.hazard, title: e.headline, title_ne: n.headline, text: (e.description || "").slice(0, 600), area: (a.areas || []).map((x) => x.en).join("; ").slice(0, 300), onset: e.onset, expires: a.expires, url: e.web, time: a.sent });
  });
  const rd = D["data/roads.json"]; if (rd) rd.routes.forEach((r, i) => add({ id: "R" + (i + 1), kind: "road", agency: (r.sources || []).map((s) => (rd.sources[s] || {}).en).filter(Boolean).join("; "), trust: "Official", title: r.name_en, title_ne: r.name_ne, text: `status ${r.status}: ${r.note_en || ""}`.slice(0, 400), url: (rd.sources[(r.sources || [])[0]] || {}).u, time: rd.as_of }));
  const rv = D["data/rivers.json"]; if (rv) rv.gauges.forEach((g, i) => add({ id: "V" + (i + 1), kind: "river", agency: "DHM", trust: "Official", title: g.en, title_ne: g.ne, text: `level ${g.level} m, warning ${g.warning} m, danger ${g.danger} m`, url: rv.url, time: rv.as_of }));
  const ar = D["data/arnab-advisory.json"]; if (ar) ar.days.forEach((d, i) => add({ id: "F" + (i + 1), kind: "forecast", agency: "DHM", trust: ar.trust, title: `${ar.event_en}: ${d.wd_en} ${d.ad} (Kartik ${d.bs}) outlook`, text: `${d.en}${d.ff ? " Flash flood risk districts: " + Object.entries(d.ff).map(([k, v]) => k + ": " + v.join(", ")).join("; ") : ""}`.slice(0, 900), url: ar.source.url, time: ar.source.sent }));
  const ta = D["data/travel-advisory.json"]; if (ta) ta.notices.forEach((n, i) => add({ id: "T" + (i + 1), kind: "travel", agency: n.en_agency, trust: n.trust, title: cut(n.en), title_ne: cut(n.ne), text: n.en, url: n.url, time: n.sent }));
  const pm = D["data/trek-permits.json"]; if (pm) Object.entries(pm.items).forEach(([k, it], i) => { const so = pm.sources[it.src] || {}; const first = (t) => String(t || "").split(/[.:]/)[0].slice(0, 140); add({ id: "P" + (i + 1), kind: "permit", agency: so.en, trust: so.trust, title: first(it.en), title_ne: first(it.ne), text: it.en + " Treks: " + Object.entries(pm.treks).filter(([, v]) => v.includes(k)).map(([t]) => t).join(", "), url: so.u, time: pm.checked }); });
  const ct = D["data/contacts.json"]; if (ct) (ct.national || []).filter((x) => x.num !== "1149").forEach((x, i) => add({ id: "C" + (i + 1), kind: "contact", agency: x.agency || x.en, trust: "Official", title: `${x.en} ${x.num}`, title_ne: `${x.ne} ${x.num}`, text: x.en + " " + x.num, url: x.url || x.src || "https://nirajbhusal.github.io/gati-alerts/contacts/", time: ct.checked || ct.as_of }));
  return items;
}

export const TOOL = { name: "reply", description: "Return the final answer and the ids of the items it is based on.", input_schema: { type: "object", properties: { answer: { type: "string", description: "The answer text, following every rule." }, cite: { type: "array", items: { type: "string" }, description: "Item ids used, for example A1, R3." } }, required: ["answer", "cite"] } };
export const SYSTEM = `You are Ask Gati, the question box of Gati, a Nepali public alert relay site.
Rules, all mandatory:
1. Gati relays, never issues. Answer ONLY from the ITEMS provided. Do not use outside knowledge, do not guess, do not forecast.
2. Cite only the ids that directly support a fact you state; when you have no information, cite nothing. Every fact must cite the id(s) of the item(s) it came from. Mention the agency and the source time in the text.
3. Never add or sum counts across different agencies. Report each agency's count or statement separately.
4. If the items do not cover the question, say plainly that Gati has no official information on it, and name the agency that would be responsible (DHM for weather, rivers and floods; NDRRMA for disasters; Nepal Police for roads and safety; NSC for earthquakes; Department of Immigration, NTB or DNPWC for trekking permits; CAAN for flights).
5. Give no advice of your own. Only repeat instructions that a cited source itself gives, attributed to it ("NDRRMA asks..."). Never end with your own suggestion such as "check with", "plan ahead" or "stay safe". Never infer that a place falls inside an area unless an item says so.
6. Reply in the language named in REPLY LANGUAGE. For Nepali, write natural Nepali, address the reader as हजुर (never तपाईं or तिमी), and use Devanagari numerals. For English, use Western digits only.
7. Never use em dashes. Keep it short: at most about 120 words.
8. For items whose trust is "Reported", say in the sentence that it is reported by media and not confirmed by Gati (Nepali: सञ्चारमाध्यममा आएको, गतिले पुष्टि नगरेको).
Return the result by calling the reply tool with {answer, cite}.`;

export function userMessage(items, q, nowIso) {
  return [{ type: "text", text: `Current Nepal time: ${nowIso}\nITEMS (JSON lines):\n` + items.map((x) => JSON.stringify(x)).join("\n"), cache_control: { type: "ephemeral" } }, { type: "text", text: `REPLY LANGUAGE: ${isNepali(q) ? "Nepali" : "English"}\nQUESTION: ${q}` }];
}

export function parseModel(text, items) {
  let o; const m = String(text || "").match(/\{[\s\S]*\}/);
  try { o = JSON.parse(m ? m[0] : text); } catch (e) { return null; }
  if (!o || typeof o.answer !== "string") return null;
  const byId = Object.fromEntries(items.map((x) => [x.id, x]));
  const citations = [...new Set(Array.isArray(o.cite) ? o.cite : [])].map((id) => byId[id]).filter(Boolean).filter((x, i, a) => a.findIndex((y) => y.url === x.url) === i).map((x) => ({ id: x.id, title: x.title, title_ne: x.title_ne || null, agency: x.agency, trust: x.trust, url: x.url, time: x.time }));
  return { answer: o.answer.replace(/\s*\[(?:[ARVFTPC]\d+(?:\s*,\s*)?)+\]/g, "").replace(/\s*\u2014\s*/g, ", ").replace(/तपाईं|तपाईँ|तपाई/g, "हजुर").trim(), citations };
}
