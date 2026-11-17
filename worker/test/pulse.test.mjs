import test from "node:test"; import assert from "node:assert/strict";
import { handle } from "../src/index.js";
import { cleanPath, flush, _reset } from "../src/pulse.js";
const O = "https://gatialerts.com";
function env(extra) { const kv = new Map(); return { ALLOWED_ORIGINS: O, PULSE_FLUSH_HITS: "3", KV: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); } }, _kv: kv, ...extra }; }
const post = (path, body, origin = O) => new Request("https://w" + path, { method: "POST", headers: { Origin: origin, "Content-Type": "text/plain", "CF-Connecting-IP": "9.9.9.9", "User-Agent": "UA-secret" }, body: JSON.stringify(body) });
const stats = async (e, h) => (await handle(new Request("https://w/stats?days=2", { headers: h || {} }), e)).json();
const only = (o) => Object.values(o.days)[0];

test("paths: ids are folded away, anything odd is refused", () => {
  assert.equal(cleanPath("/weather/"), "/weather/"); assert.equal(cleanPath("/"), "/"); assert.equal(cleanPath("/roads"), "/roads/");
  assert.equal(cleanPath("/alerts/np.gati.x-2026/"), "/alerts/*"); assert.equal(cleanPath("/gati-alerts/route/?from=ktm&to=pokhara"), "/route/");
  assert.equal(cleanPath("/about/index.html#video"), "/about/");
  for (const bad of ["weather", "/<script>", "/a b/", 7, null, "/" + "x".repeat(80)]) assert.equal(cleanPath(bad), null);
});
test("hits are counted in total, in batches, and nothing about the visitor is stored", async () => {
  _reset(); const e = env();
  for (const p of ["/", "/", "/weather/"]) assert.equal((await handle(post("/hit", { p }), e)).status, 204);
  assert.equal((await handle(post("/hit", { p: "/", e: "route_check" }), e)).status, 204);
  const s = only(await stats(e)); assert.deepEqual(s.pages, { "/": 2, "/weather/": 1 }); assert.deepEqual(s.events, { route_check: 1 });
  const stored = [...e._kv.entries()].flat().join(" "); assert.ok(!/9\.9\.9\.9|UA-secret/.test(stored)); assert.ok([...e._kv.keys()].every((k) => /^pulse:\d{4}-\d\d-\d\d$/.test(k)));
});
test("refusals: other origins, unknown events, bad paths", async () => {
  _reset(); const e = env();
  assert.equal((await handle(post("/hit", { p: "/" }, "https://evil.example"), e)).status, 403);
  assert.equal((await handle(post("/hit", { p: "/", e: "anything" }), e)).status, 400);
  assert.equal((await handle(post("/hit", { p: "javascript:x" }), e)).status, 400);
  assert.equal((await handle(post("/fb", { p: "/", v: "great" }), e)).status, 400);
});
test("feedback: votes are public totals, notes are scrubbed and need the token", async () => {
  _reset(); const e = env({ STATS_TOKEN: "t0k" });
  assert.equal((await handle(post("/fb", { p: "/weather/", v: "useful" }), e)).status, 204);
  assert.equal((await handle(post("/fb", { p: "/weather/", v: "wrong", note: "Rain figure is old. Call me 9801234567 or a@b.co", lang: "en" }), e)).status, 204);
  const pub = await stats(e); assert.deepEqual(only(pub).votes, { "/weather/": { useful: 1, unclear: 0, wrong: 1 } }); assert.equal(only(pub).notes, undefined);
  const priv = only(await stats(e, { Authorization: "Bearer t0k" })); assert.equal(priv.notes.length, 1);
  assert.ok(!/9801234567|a@b\.co/.test(priv.notes[0].note)); assert.ok(/Rain figure is old/.test(priv.notes[0].note));
});
test("no storage bound: 503, and the other routes still answer", async () => {
  _reset(); const e = env(); delete e.KV;
  assert.equal((await handle(post("/hit", { p: "/" }), e)).status, 503);
  await flush(e);
});
