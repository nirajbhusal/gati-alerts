import test from "node:test"; import assert from "node:assert/strict";
import { scrub, validReport, issueFor, stripJpeg, decodePhoto, HAZARDS } from "../src/report.js";
import { handle } from "../src/index.js";

const good = (o = {}) => ({ hazard: HAZARDS[1], district: "गोरखा / Gorkha", municipality: "Aarughat", ward: "३", place: "Soti bridge", gps: "28.123456, 84.987654",
  observed: "2026-11-11T09:30", description: "पहिरोले बाटो पूरै बन्द छ, गाडी रोकिएका छन्।", consent: true, elapsed: 9000, website: "", ...o });
const ORIGIN = "https://nirajbhusal.github.io";
const kv = () => { const m = new Map(); return { m, get: async (k, t) => (m.has(k) ? m.get(k) : null), put: async (k, v) => void m.set(k, v) }; };
const env = (o = {}) => ({ ALLOWED_ORIGINS: ORIGIN, GITHUB_TOKEN: "ghp_x", REPORT_REPO: "nirajbhusal/gati-alerts", KV: kv(), ...o });
const post = (body, h = {}) => new Request("https://w.example/report", { method: "POST", headers: { Origin: ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": "1.2.3.4", ...h }, body: JSON.stringify(body) });
const gh = (calls) => async (url, init) => { calls.push({ url: String(url), init }); return new Response(JSON.stringify({ number: 77, html_url: "https://github.com/nirajbhusal/gati-alerts/issues/77" }), { status: 201 }); };

/* A tiny JPEG: SOI, APP0 (JFIF), APP1 (fake EXIF with GPS text), COM, SOS + data, EOI. */
const seg = (mk, bytes) => [0xff, mk, ((bytes.length + 2) >> 8) & 255, (bytes.length + 2) & 255, ...bytes];
const txt = (s) => [...Buffer.from(s)];
const JPEG = new Uint8Array([0xff, 0xd8, ...seg(0xe0, txt("JFIF\0")), ...seg(0xe1, txt("Exif\0\0GPS 28.1234,84.9876 secret")), ...seg(0xfe, txt("made by phone")), ...seg(0xda, [1, 2, 3]), 9, 9, 9, 0xff, 0xd9]);

test("scrub removes contacts, links and mentions", () => {
  const s = scrub("फोन ९८४१२३४५६७ वा 9841-234-567, mail a.b@x.org, see https://evil.example/x @someone <img src=x> ![a](b)");
  for (const bad of ["९८४१२३४५६७", "9841", "a.b@x.org", "evil.example", "<img"]) assert.ok(!s.includes(bad), bad);
  assert.ok(!/@someone/.test(s)); assert.ok(!s.includes("!["));
  assert.equal(scrub("वडा ३ मा २ घर बगे, 15 जना"), "वडा ३ मा २ घर बगे, 15 जना");
});

test("validation: required fields, honeypot, speed, gps rounding", () => {
  const { report } = validReport(good());
  assert.equal(report.gps, "28.1235, 84.9877"); assert.equal(report.ward, "3"); assert.equal(report.observed, "2026-11-11 09:30 NPT");
  assert.equal(validReport(good({ website: "http://spam" })).error, "rejected");
  assert.equal(validReport(good({ elapsed: 500 })).error, "too_fast");
  assert.equal(validReport(good({ consent: "yes" })).error, "consent");
  assert.equal(validReport(good({ hazard: "Aliens" })).error, "hazard");
  assert.equal(validReport(good({ description: "short" })).error, "description");
  assert.equal(validReport(good({ gps: "999, 999" })).report.gps, "");
});

test("issue uses the same headings as the GitHub form", () => {
  const i = issueFor(validReport(good()).report, true);
  assert.equal(i.title, "[Report] Landslide — Gorkha, Aarughat");
  assert.deepEqual(i.labels, ["reported", "citizen-report"]);
  for (const h of ["### जोखिमको प्रकार / Hazard type", "### GPS (lat, lon)", "### के देख्नुभयो? / What did you see?", "Not confirmed", "held privately"]) assert.ok(i.body.includes(h), h);
});

test("jpeg metadata is stripped, non-jpeg is refused", () => {
  const out = stripJpeg(JPEG), s = Buffer.from(out).toString("latin1");
  assert.ok(!s.includes("GPS") && !s.includes("Exif") && !s.includes("made by phone"));
  assert.ok(s.includes("JFIF")); assert.equal(out[0], 0xff); assert.equal(out.at(-1), 0xd9);
  assert.equal(stripJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47])), null);
  assert.equal(decodePhoto("data:image/png;base64,AAAA"), null);
});

test("POST /report creates an issue, holds the photo privately, never sends contact details", async () => {
  const calls = [], e = env({ MOD_TOKEN: "m".repeat(24) });
  const r = await handle(post(good({ description: "पहिरोले बाटो बन्द, फोन 9841234567 मा सोध्नुहोस्", photo: "data:image/jpeg;base64," + Buffer.from(JPEG).toString("base64") })), e, gh(calls));
  assert.equal(r.status, 201); const j = await r.json(); assert.equal(j.number, 77); assert.equal(j.photo, true);
  assert.equal(calls[0].url, "https://api.github.com/repos/nirajbhusal/gati-alerts/issues");
  assert.equal(calls[0].init.headers.Authorization, "Bearer ghp_x");
  const sent = calls[0].init.body; assert.ok(!sent.includes("9841234567")); assert.ok(!sent.includes("1.2.3.4")); assert.ok(!sent.includes("base64"));
  assert.ok(!Buffer.from(e.KV.m.get("photo:77")).toString("latin1").includes("GPS"));
  const no = await handle(new Request("https://w.example/report/photo/77", { headers: { Authorization: "Bearer wrong" } }), e);
  assert.equal(no.status, 403);
  const ok = await handle(new Request("https://w.example/report/photo/77", { headers: { Authorization: "Bearer " + "m".repeat(24) } }), e);
  assert.equal(ok.status, 200); assert.equal(ok.headers.get("Content-Type"), "image/jpeg");
});

test("POST /report: origin, config, rate limit and challenge", async () => {
  const calls = [];
  assert.equal((await handle(post(good(), { Origin: "https://evil.example" }), env(), gh(calls))).status, 403);
  assert.equal((await handle(post(good()), env({ GITHUB_TOKEN: "" }), gh(calls))).status, 503);
  assert.equal((await handle(post(good()), env({ TURNSTILE_SECRET: "s" }), gh(calls))).status, 403);
  assert.equal(calls.length, 0);
  const e = env({ REPORT_PER_IP_PER_HOUR: "2" });
  assert.equal((await handle(post(good()), e, gh(calls))).status, 201);
  assert.equal((await handle(post(good()), e, gh(calls))).status, 201);
  assert.equal((await handle(post(good()), e, gh(calls))).status, 429);
  assert.equal(calls.length, 2);
});
