/* Privacy-safe counting and one-tap feedback.
   POST /hit  {p, e?}        -> a page view (or one named event) is added to today's totals.
   POST /fb   {p, v, note?}  -> "useful" / "unclear" / "wrong" for a page, with an optional short note.
   GET  /stats?days=14       -> the totals per day, public. Notes are included only with the STATS_TOKEN secret.
   What is kept: totals per page per day. What is never kept: IP addresses, cookies, identifiers, user agents, referrers.
   Counts are approximate: hits are gathered in memory and written in batches, so a few can be lost. */
import { scrub } from "./report.js";

const json = (o, status, h) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...(h || {}) } });
const today = (now = Date.now()) => new Date(now + 345 * 60000).toISOString().slice(0, 10);
export const EVENTS = ["district_set", "route_check", "more_open", "share"];
export const VOTES = ["useful", "unclear", "wrong"];
const KEEP_DAYS = 400, MAX_NOTES = 200, MAX_PATHS = 400, FLUSH_HITS = 25, FLUSH_MS = 120000, NOTE_PER_MIN = 30;

/* Only the page's own path is kept, with ids folded away: /alerts/<identifier>/ becomes /alerts/* */
export function cleanPath(p) {
  if (typeof p !== "string" || p.length > 200) return null;
  let s = p.split(/[?#]/)[0].toLowerCase().replace(/index\.html$/, "");
  if (!/^\/[a-z0-9._\-/]*$/.test(s)) return null;
  s = s.replace(/^\/gati-alerts\//, "/").replace(/^\/alerts\/[^/]+\/?$/, "/alerts/*").replace(/^\/cap\/.*$/, "/cap/*");
  if (!s.endsWith("/") && !s.endsWith("*") && !/\.[a-z0-9]+$/.test(s)) s += "/";
  return s.length > 60 ? null : s;
}

/* in-memory batch for this isolate */
let buf = { day: "", pages: {}, events: {}, n: 0, t: 0 }, noteMin = { m: 0, n: 0 };
export const _reset = () => { buf = { day: "", pages: {}, events: {}, n: 0, t: 0 }; noteMin = { m: 0, n: 0 }; };
const key = (d) => `pulse:${d}`;
const read = async (env, d) => { try { return JSON.parse((await env.KV.get(key(d))) || "null") || { pages: {}, events: {}, votes: {}, notes: [] }; } catch (e) { return { pages: {}, events: {}, votes: {}, notes: [] }; } };
const write = (env, d, doc) => env.KV.put(key(d), JSON.stringify(doc), { expirationTtl: KEEP_DAYS * 86400 });
const add = (into, from) => { for (const k of Object.keys(from)) if (k in into || Object.keys(into).length < MAX_PATHS) into[k] = (into[k] || 0) + from[k]; };

export async function flush(env) {
  if (!env.KV || !buf.n) return;
  const b = buf; buf = { day: b.day, pages: {}, events: {}, n: 0, t: Date.now() };
  const doc = await read(env, b.day); add(doc.pages, b.pages); add(doc.events, b.events);
  await write(env, b.day, doc);
}

export async function handlePulse(req, env, cors, ctx) {
  const url = new URL(req.url);
  if (url.pathname === "/stats" && req.method === "GET") {
    if (!env.KV) return json({ error: "not_configured" }, 503);
    await flush(env);
    const days = Math.max(1, Math.min(90, parseInt(url.searchParams.get("days") || "14", 10) || 14));
    const tok = String(env.STATS_TOKEN || "").trim(), withNotes = !!tok && req.headers.get("Authorization") === `Bearer ${tok}`;
    const out = {};
    for (let i = 0; i < days; i++) { const d = today(Date.now() - i * 864e5), raw = await env.KV.get(key(d)); if (!raw) continue;
      try { const doc = JSON.parse(raw); if (!withNotes) delete doc.notes; out[d] = doc; } catch (e) {} }
    return json({ days: out, notes: withNotes, note: "Totals per page per day in Nepal time. Approximate. No IP addresses or identifiers are kept." }, 200, { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
  }
  if (!cors) return json({ error: "origin_not_allowed" }, 403);
  if (!env.KV) return json({ error: "not_configured" }, 503, cors);
  let b; try { b = JSON.parse(await req.text()); } catch (e) { return json({ error: "bad_json" }, 400, cors); }
  const p = cleanPath(b && b.p); if (!p) return json({ error: "bad_path" }, 400, cors);
  const d = today();
  if (url.pathname === "/hit") {
    if (buf.day !== d) { await flush(env); buf = { day: d, pages: {}, events: {}, n: 0, t: Date.now() }; }
    if (b.e !== undefined) { if (!EVENTS.includes(b.e)) return json({ error: "bad_event" }, 400, cors); buf.events[b.e] = (buf.events[b.e] || 0) + 1; }
    else buf.pages[p] = (buf.pages[p] || 0) + 1;
    buf.n++;
    if (buf.n >= (+env.PULSE_FLUSH_HITS || FLUSH_HITS) || Date.now() - buf.t > FLUSH_MS) { const job = flush(env); if (ctx && ctx.waitUntil) ctx.waitUntil(job); else await job; }
    return new Response(null, { status: 204, headers: cors });
  }
  /* /fb: rare and valuable, so it is written straight away */
  if (!VOTES.includes(b.v)) return json({ error: "bad_vote" }, 400, cors);
  const minute = Math.floor(Date.now() / 60000); if (noteMin.m !== minute) noteMin = { m: minute, n: 0 };
  if (++noteMin.n > NOTE_PER_MIN) return json({ error: "rate_limited" }, 429, cors);
  const doc = await read(env, d);
  if (p in doc.votes || Object.keys(doc.votes).length < MAX_PATHS) { const v = doc.votes[p] || (doc.votes[p] = { useful: 0, unclear: 0, wrong: 0 }); v[b.v]++; }
  const note = typeof b.note === "string" ? scrub(b.note).replace(/\s+/g, " ").slice(0, 200) : "";
  if (note && doc.notes.length < MAX_NOTES) doc.notes.push({ p, v: b.v, note, lang: b.lang === "en" ? "en" : "ne" });
  await write(env, d, doc);
  return new Response(null, { status: 204, headers: cors });
}
