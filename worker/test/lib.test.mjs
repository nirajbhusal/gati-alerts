import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { corsHeaders, validQuestion, buildItems, parseModel, SYSTEM } from "../src/lib.js";
import { handle } from "../src/index.js";
const ROOT = new URL("../../", import.meta.url).pathname;
const D = {}; for (const f of ["data/alerts.json", "data/roads.json", "data/rivers.json", "data/arnab-advisory.json", "data/travel-advisory.json", "data/trek-permits.json", "data/contacts.json"]) D[f] = JSON.parse(fs.readFileSync(ROOT + f, "utf8"));
const NOW = Date.parse("2026-10-28T14:00:00+05:45");
test("cors only for allowed origins", () => { const A = "https://nirajbhusal.github.io,http://localhost:8933"; assert.ok(corsHeaders("https://nirajbhusal.github.io", A)); assert.equal(corsHeaders("https://evil.example", A), null); });
test("question validation", () => { assert.equal(validQuestion("", 400), "empty"); assert.equal(validQuestion("x".repeat(401), 400), "too_long"); assert.equal(validQuestion("Is Prithvi highway open?", 400), null); });
test("items: no 1149, every item has url and time", () => { const it = buildItems(D, NOW); assert.ok(it.length > 20); assert.ok(!it.some((x) => /1149/.test(x.title))); for (const x of it) { assert.ok(x.id); assert.ok(x.time, x.id + " time"); } });
test("system prompt carries the rules", () => { for (const s of ["never issues", "Never add or sum", "हजुर", "em dashes", "ONLY", "REPLY LANGUAGE"]) assert.ok(SYSTEM.includes(s), s); });
test("parse maps ids to real citations, drops invented ids, strips em dash and तपाईं", () => { const it = buildItems(D, NOW); const o = parseModel('```json\n{"answer":"तपाईं: Gorkha \u2014 blocked","cite":["A1","Z99","A1"]}\n```', it); assert.equal(o.citations.length, 1); assert.equal(o.citations[0].url, it[0].url); assert.ok(!o.answer.includes("\u2014")); assert.ok(o.answer.includes("हजुर")); assert.equal(parseModel("not json", it), null); });
function env(extra) { const kv = new Map(); return { ALLOWED_ORIGINS: "https://nirajbhusal.github.io", DATA_BASE: "https://x/", MAX_QUESTION_CHARS: "400", PER_IP_PER_MIN: "2", PER_IP_PER_DAY: "60", DAILY_CAP: "100", ANTHROPIC_API_KEY: "test", KV: { get: async (k) => kv.get(k) || null, put: async (k, v) => kv.set(k, v) }, ...extra }; }
const fetcher = async (u, o) => { if (u.startsWith("https://api.anthropic.com")) { const b = JSON.parse(o.body); fetcher.last = b; return new Response(JSON.stringify({ model: b.model, content: [{ type: "tool_use", name: "reply", input: { answer: "Nepal Police reports Aarughat road blocked.", cite: ["A1"] } }] })); } const f = u.replace("https://x/", ""); return D[f] ? new Response(JSON.stringify(D[f])) : new Response("", { status: 404 }); };
const req = (q, origin = "https://nirajbhusal.github.io", ip = "1.1.1.1") => new Request("https://w/ask", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "CF-Connecting-IP": ip }, body: JSON.stringify({ q }) });
test("worker end to end with mocked Claude", async () => { const e = env(); const r = await handle(req("Is the road to Gorkha open?"), e, fetcher); assert.equal(r.status, 200); const j = await r.json(); assert.ok(j.answer); assert.ok(j.citations[0].url); assert.equal(fetcher.last.model, "claude-haiku-5-5"); assert.equal(r.headers.get("Access-Control-Allow-Origin"), "https://nirajbhusal.github.io"); });
test("worker: model configurable", async () => { await handle(req("hi"), env({ MODEL: "claude-sonnet-4-5" }), fetcher); assert.equal(fetcher.last.model, "claude-sonnet-4-5"); });
test("worker: bad origin 403, long question 400, rate limit 429", async () => { const e = env(); assert.equal((await handle(req("x", "https://evil.example"), e, fetcher)).status, 403); assert.equal((await handle(req("x".repeat(500)), e, fetcher)).status, 400); await handle(req("a"), e, fetcher); await handle(req("b"), e, fetcher); assert.equal((await handle(req("c"), e, fetcher)).status, 429); });
test("worker: daily cap", async () => { const e = env({ DAILY_CAP: "1", PER_IP_PER_MIN: "99" }); assert.equal((await handle(req("a", undefined, "1"), e, fetcher)).status, 200); assert.equal((await handle(req("b", undefined, "2"), e, fetcher)).status, 429); });
test("worker: no key gives 503", async () => { const e = env({ ANTHROPIC_API_KEY: "" }); assert.equal((await handle(req("a"), e, fetcher)).status, 503); });

import { clean, neDigits, STATUSES } from "../src/lib.js";
test("card: structure, validation, no Gati-confirmed claims, Nepali digits", () => {
  const it = [{ id: "A1", url: "u1", title: "t", agency: "Nepal Police", trust: "Official", time: "2026-10-28T02:15:00Z" }, { id: "A2", url: "u1", title: "t2", agency: "Nepal Police", trust: "Official", time: "2026-10-28T03:00:00Z" }, { id: "P1", url: "u2", title: "p", agency: "DoI", trust: "Reported", time: "2026-10-28T08:20:00Z" }];
  const o = parseModel(JSON.stringify({ status: "alert", headline: "नेपाल प्रहरी अनुसार सडक बन्द छ। गतिले यो पुष्टि गरेको छ।", points: [{ text: "शुल्क रु. 3,000 [P1]", cite: ["P1", "X9"] }, { text: "no cite", cite: [] }, { text: "dup", cite: ["A2"] }, { text: "4th", cite: ["A1"] }], todo: [], refer: ["NSC", "Bogus"], answer: "x", cite: ["A1"] }), it, true);
  assert.equal(o.card.status, "alert");
  assert.ok(!/गतिले\s*यो\s*पुष्टि गरेको/.test(o.card.headline));
  assert.equal(o.card.points[0].text, "शुल्क रु. ३,०००");
  assert.equal(o.card.points.length, 2);
  assert.deepEqual(o.card.points[1].cite, ["A1"]);
  assert.equal(o.citations.length, 2);
  assert.equal(o.card.reported, true);
  assert.deepEqual(o.card.refer.map((r) => r.key), ["NSC"]);
  assert.equal(typeof o.answer, "string");
  assert.equal(parseModel(JSON.stringify({ status: "clear", headline: "h", points: [], answer: "a", cite: [] }), it).card.status, "no_info");
  assert.equal(parseModel(JSON.stringify({ answer: "old style", cite: ["A1"] }), it).card.status, "caution");
  assert.equal(clean("Verified by Gati, open.", false).includes("Gati"), false);
  assert.equal(neDigits("12"), "१२"); assert.equal(STATUSES.length, 4);
});

import { noAdvice } from "../src/lib.js";
test("guards: no own advice in not_covered, alert only when in effect, info for fees", () => {
  assert.equal(noAdvice("X स्रोतमा छैन; हजुरले आफैं DHM हेर्न सक्नुहुन्छ।"), "X स्रोतमा छैन");
  assert.equal(noAdvice("Gati has no official information on Y. You can check with DoR."), "Gati has no official information on Y.");
  const fut = [{ id: "A1", kind: "alert", url: "u", agency: "DHM", trust: "Official", severity: "Moderate", onset: "2999-01-01T00:00:00Z", expires: "2999-02-01T00:00:00Z", title: "t", text: "" }];
  assert.equal(parseModel(JSON.stringify({ status: "alert", headline: "h", points: [], answer: "a", cite: ["A1"] }), fut).card.status, "caution");
  const now = [{ ...fut[0], onset: "2000-01-01T00:00:00Z" }];
  assert.equal(parseModel(JSON.stringify({ status: "alert", headline: "h", points: [], answer: "a", cite: ["A1"] }), now).card.status, "alert");
  const fee = [{ id: "P1", kind: "permit", url: "p", agency: "DoI", trust: "Official", title: "f", text: "" }];
  assert.equal(parseModel(JSON.stringify({ status: "caution", headline: "h", points: [], answer: "a", cite: ["P1"] }), fee).card.status, "info");
});
