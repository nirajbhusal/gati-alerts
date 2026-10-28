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

/* Referral agencies: homepages already used and checked on the Gati site (NSC, DoR, NTB, DNPWC re-checked 28 Oct 2026) */
export const REFER = { DHM: ["जल तथा मौसम विज्ञान विभाग", "Department of Hydrology and Meteorology", "https://www.dhm.gov.np/"], NDRRMA: ["राष्ट्रिय विपद् जोखिम न्यूनीकरण तथा व्यवस्थापन प्राधिकरण", "NDRRMA", "https://ndrrma.gov.np/"], "Nepal Police": ["नेपाल प्रहरी", "Nepal Police", "https://www.nepalpolice.gov.np/"], NSC: ["राष्ट्रिय भूकम्प मापन तथा अनुसन्धान केन्द्र", "National Earthquake Monitoring and Research Center (NSC)", "https://seismonepal.gov.np/"], DoR: ["सडक विभाग", "Department of Roads", "https://dor.gov.np/"], "Department of Immigration": ["अध्यागमन विभाग", "Department of Immigration", "https://immigration.gov.np/en/page/trekking-route"], NTB: ["नेपाल पर्यटन बोर्ड", "Nepal Tourism Board", "https://ntb.gov.np/"], DNPWC: ["राष्ट्रिय निकुञ्ज तथा वन्यजन्तु संरक्षण विभाग", "DNPWC", "https://dnpwc.gov.np/"], CAAN: ["नेपाल नागरिक उड्डयन प्राधिकरण", "CAAN", "https://caanepal.gov.np/"] };
export const STATUSES = ["alert", "caution", "clear", "info", "no_info"];
const PT = { type: "object", properties: { text: { type: "string" }, cite: { type: "array", items: { type: "string" } } }, required: ["text", "cite"] };
export const TOOL = { name: "reply", description: "Return the structured answer.", input_schema: { type: "object", properties: {
  status: { type: "string", enum: STATUSES, description: "alert = ONLY an active warning, closure or blockage in effect right now (current time inside its onset/expiry); caution = forecasts, outlooks, advisories, future or possible risk, partial disruption; clear = a cited source says open or normal now; info = neutral facts such as fees, permits, rules, contacts, holidays; no_info = the items do not answer the question." },
  headline: { type: "string", description: "One plain sentence, the direct answer first, attributed to the agency. Max about 20 words." },
  points: { type: "array", maxItems: 3, items: PT, description: "Up to 3 short key facts, each with the ids that support it." },
  todo: { type: "array", maxItems: 2, items: PT, description: "Only instructions a cited source itself gives, attributed ('NDRRMA asks...'). Empty if none." },
  not_covered: { type: "string", description: "One short factual line naming only what Gati has no official information on, or empty. No suggestions, no 'you can check', no agency instructions." },
  refer: { type: "array", items: { type: "string", enum: Object.keys(REFER) }, description: "Responsible agency names when you refer the reader to one (always for no_info)." },
  answer: { type: "string", description: "The same answer as one short paragraph." },
  cite: { type: "array", items: { type: "string" }, description: "All item ids used." } }, required: ["status", "headline", "points", "answer", "cite"] } };
export const SYSTEM = `You are Ask Gati, the question box of Gati, a Nepali public alert relay site.
Rules, all mandatory:
1. Gati relays, never issues. Answer ONLY from the ITEMS provided. Do not use outside knowledge, do not guess, do not forecast.
2. Every fact must cite the id(s) of the item(s) it came from. Cite nothing when you have no information. Do not write ids like [A1] in the text.
3. Attribute every fact to the agency: "Nepal Police अनुसार ...", "According to DHM ...". NEVER say that Gati confirmed, verified or checked anything (never write गतिले पुष्टि गरेको, गतिले प्रमाणित, "Gati confirms", "verified by Gati").
4. Never add or sum counts across different agencies. Report each agency separately.
5. If the items do not cover the question, status is no_info: say plainly that Gati has no official information on it and put the responsible agency in refer (DHM weather, rivers, floods; NDRRMA disasters; Nepal Police roads and safety; DoR road works; NSC earthquakes; Department of Immigration, NTB or DNPWC trekking permits; CAAN flights). If partly covered, fill not_covered with only what is missing ("Gati has no official information on X."); never tell the reader to check, look up or contact anything there. Write not_covered in the REPLY LANGUAGE too.
10. Status: alert only for warnings, closures or blockages in effect now. Forecasts, outlooks and advisories about coming days are caution. Fees, permits, rules, contacts and other neutral facts are info.
6. Give no advice of your own. todo holds only instructions a cited source itself gives, attributed to it. Never write your own suggestion such as "check with", "plan ahead" or "stay safe". Never infer that a place falls inside an area unless an item says so.
7. Reply in the language named in REPLY LANGUAGE. Nepali: natural Nepali, address the reader as हजुर (never तपाईं or तिमी), Devanagari numerals for every number, including inside amounts like रु. ३,०००. English: Western digits only.
8. Never use em dashes. Plain words. Headline first, max about 20 words; each point max about 25 words.
9. For items whose trust is "Reported", say it is reported by media and not officially confirmed (Nepali: सञ्चारमाध्यममा आएको, आधिकारिक पुष्टि नभएको).
Return the result by calling the reply tool.`;

export function userMessage(items, q, nowIso) {
  return [{ type: "text", text: `Current Nepal time: ${nowIso}\nITEMS (JSON lines):\n` + items.map((x) => JSON.stringify(x)).join("\n"), cache_control: { type: "ephemeral" } }, { type: "text", text: `REPLY LANGUAGE: ${isNepali(q) ? "Nepali" : "English"}\nQUESTION: ${q}` }];
}

const DEV = "०१२३४५६७८९";
export const neDigits = (t) => String(t).replace(/[0-9]/g, (d) => DEV[d]);
const BADCLAIM = [[/गतिले\s*(यो|यस|यी|सो)?\s*(कुरा)?\s*(पुष्टि|प्रमाणित|जाँच)\s*गरेको\s*(छ|हो|छैन)?/g, "स्रोतले जनाएको"], [/(?:has been |is )?(?:confirmed|verified) by Gati/gi, "per the source"], [/Gati (?:has )?(?:confirmed|verified)/gi, "the source says"], [/not confirmed by Gati/gi, "not officially confirmed"], [/गतिले पुष्टि नगरेको/g, "आधिकारिक पुष्टि नभएको"]];
export function clean(t, ne) {
  let x = String(t || "").replace(/^.*?(?:\.\.\.|…)\s*(?:no|wait|sorry|actually)[.,!]\s*/i, "").replace(/\s*\[(?:[ARVFTPC]\d+(?:\s*,\s*)?)+\]/g, "").replace(/\s*\u2014\s*/g, ", ").replace(/तपाईं|तपाईँ|तपाई/g, "हजुर");
  x = x.replace(BADCLAIM[4][0], BADCLAIM[4][1]).replace(BADCLAIM[3][0], BADCLAIM[3][1]);
  for (const [re, to] of BADCLAIM.slice(0, 3)) x = x.replace(re, to);
  if (ne) x = neDigits(x);
  return x.replace(/\s{2,}/g, " ").trim();
}
const ADVICE = [/[^.।;]*(?:हजुर(?:ले)?\s*)?(?:आफैं|आफै|आफैँ)?[^.।;]*(?:हेर्न सक्नुहुन्छ|हेर्नुहोस्|जाँच्नुहोस्|सम्पर्क गर्नुहोस्|बुझ्नुहोस्|हेर्न सकिन्छ|सम्पर्क गर्न सक्नुहुन्छ)[^.।;]*[.।]?/g, /[^.;]*\b(?:you (?:can|may|should|could)|please|we recommend|consider|check with|contact|refer to|visit|plan ahead|stay safe)\b[^.;]*[.;]?/gi];
export function noAdvice(t) { let x = String(t || ""); for (const re of ADVICE) x = x.replace(re, ""); return x.replace(/[;,]\s*$/, "").replace(/\s{2,}/g, " ").trim(); }
export function parseModel(text, items, ne = false) {
  let o; const m = String(text || "").match(/\{[\s\S]*\}/);
  try { o = JSON.parse(m ? m[0] : text); } catch (e) { return null; }
  if (!o || (typeof o.answer !== "string" && typeof o.headline !== "string")) return null;
  const byId = Object.fromEntries(items.map((x) => [x.id, x]));
  const ids = (a) => [...new Set(Array.isArray(a) ? a : [])].filter((id) => byId[id]);
  const pts = (a, n) => (Array.isArray(a) ? a : []).filter((p) => p && typeof p.text === "string" && p.text.trim()).slice(0, n).map((p) => ({ text: clean(p.text, ne), cite: ids(p.cite) })).filter((p) => p.cite.length);
  const points = pts(o.points, 3), todo = pts(o.todo, 2);
  const all = [...new Set([...ids(o.cite), ...points.flatMap((p) => p.cite), ...todo.flatMap((p) => p.cite)])];
  const citations = all.map((id) => byId[id]).filter((x, i, a) => a.findIndex((y) => y.url === x.url) === i).map((x) => ({ id: x.id, title: x.title, title_ne: x.title_ne || null, agency: x.agency, trust: x.trust, url: x.url, time: x.time, severity: x.severity || null }));
  const urlOf = Object.fromEntries(all.map((id) => [id, byId[id].url])), keep = new Set(citations.map((c) => c.id)), canon = (id) => citations.find((c) => c.url === urlOf[id]).id;
  const fix = (L) => L.map((p) => ({ ...p, cite: [...new Set(p.cite.map(canon))] }));
  let status = STATUSES.includes(o.status) ? o.status : (citations.length ? "caution" : "no_info");
  if (!citations.length) status = "no_info";
  const nowT = Date.now(), live = all.some((id) => { const x = byId[id]; if (x.kind === "road") return /status (closed|blocked|one.?way)/i.test(x.text) || /blocked|closed/i.test(x.title + x.text); if (x.kind === "alert") return (!x.onset || Date.parse(x.onset) <= nowT) && (!x.expires || Date.parse(x.expires) > nowT) && /Moderate|Severe|Extreme/.test(x.severity || ""); return false; });
  if (status === "alert" && !live) status = "caution";
  if (status !== "no_info" && all.length && all.every((id) => ["permit", "contact"].includes(byId[id].kind))) status = "info";
  const refer = [...new Set(Array.isArray(o.refer) ? o.refer : [])].filter((k) => REFER[k]).map((k) => ({ key: k, name: REFER[k][ne ? 0 : 1], url: REFER[k][2] }));
  const headline = clean(o.headline || String(o.answer).split(/(?<=[.।])\s/)[0], ne);
  const answer = clean(typeof o.answer === "string" && o.answer.trim() ? o.answer : [headline, ...points.map((p) => p.text)].join(" "), ne);
  const times = citations.map((c) => Date.parse(c.time)).filter((t) => !isNaN(t));
  return { answer, citations, card: { v: 1, status, headline, points: fix(points), todo: fix(todo), not_covered: ((t) => (ne && t && !/[\u0900-\u097F]/.test(t) ? "" : t))(noAdvice(clean(o.not_covered || "", ne))), refer, reported: citations.some((c) => c.trust === "Reported"), as_of: times.length ? new Date(Math.max(...times)).toISOString() : null, ai: true } };
}
