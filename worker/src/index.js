/* Ask Gati Worker: POST /ask {q} -> {answer, citations[]}. Key comes from the ANTHROPIC_API_KEY secret only. */
import { TOOL, FILES, corsHeaders, validQuestion, buildItems, SYSTEM, userMessage, parseModel } from "./lib.js";

const json = (o, status, h) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...(h || {}) } });
const day = () => new Date(Date.now() + 345 * 60000).toISOString().slice(0, 10);

async function bump(env, key, ttl, limit) {
  if (!env.KV) return true;
  const n = parseInt((await env.KV.get(key)) || "0", 10);
  if (n >= limit) return false;
  await env.KV.put(key, String(n + 1), { expirationTtl: ttl });
  return true;
}

let dataCache = { t: 0, D: null };
async function loadData(env, fetcher = fetch) {
  if (dataCache.D && Date.now() - dataCache.t < 120000) return dataCache.D;
  const out = {};
  await Promise.all(FILES.map(async (f) => { try { const r = await fetcher(env.DATA_BASE + f, { cf: { cacheTtl: 60 } }); if (r.ok) out[f] = await r.json(); } catch (e) {} }));
  dataCache = { t: Date.now(), D: out };
  return out;
}

export async function handle(req, env, fetcher = fetch) {
  const origin = req.headers.get("Origin") || "", cors = corsHeaders(origin, env.ALLOWED_ORIGINS || "");
  const url = new URL(req.url);
  if (req.method === "OPTIONS") return cors ? new Response(null, { status: 204, headers: cors }) : new Response(null, { status: 403 });
  if (url.pathname !== "/ask" || req.method !== "POST") return json({ error: "not_found" }, 404, cors || {});
  if (!cors) return json({ error: "origin_not_allowed" }, 403);
  let body; try { body = await req.json(); } catch (e) { return json({ error: "bad_json" }, 400, cors); }
  const bad = validQuestion(body && body.q, +env.MAX_QUESTION_CHARS || 400); if (bad) return json({ error: bad }, 400, cors);
  const ip = req.headers.get("CF-Connecting-IP") || "0", minute = Math.floor(Date.now() / 60000);
  if (!(await bump(env, `m:${ip}:${minute}`, 120, +env.PER_IP_PER_MIN || 6)) || !(await bump(env, `d:${ip}:${day()}`, 90000, +env.PER_IP_PER_DAY || 60))) return json({ error: "rate_limited" }, 429, { ...cors, "Retry-After": "60" });
  if (!(await bump(env, `cap:${day()}`, 90000, +env.DAILY_CAP || 2000))) return json({ error: "daily_cap" }, 429, cors);
  const KEY = String(env.ANTHROPIC_API_KEY || "").trim().replace(/^["']|["']$/g, "").trim();
  if (!KEY) return json({ error: "not_configured" }, 503, cors);
  const items = buildItems(await loadData(env, fetcher));
  const nowIso = new Date(Date.now() + 345 * 60000).toISOString().slice(0, 16) + "+05:45";
  const call = (tc) => fetcher("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: env.MODEL || "claude-haiku-5-5", max_tokens: +env.MAX_TOKENS || 1500, ...(env.TEMPERATURE !== undefined && env.TEMPERATURE !== "" ? { temperature: +env.TEMPERATURE } : {}), system: SYSTEM, tools: [TOOL], tool_choice: tc, messages: [{ role: "user", content: userMessage(items, body.q.trim(), nowIso) }] }) });
  /* some models refuse a forced tool; retry once with auto (the prompt still asks for the reply tool) */
  let r = await call({ type: "tool", name: "reply" });
  if (r.status === 400) { const t = await r.clone().text(); if (/tool_choice/.test(t)) r = await call({ type: "auto" }); }
  if (!r.ok) { let msg = ""; try { msg = ((await r.json()).error || {}).message || ""; } catch (e) {} return json({ error: "upstream", status: r.status, detail: msg.slice(0, 200), ...(r.status === 401 ? { key_shape: { len: KEY.length, sk_ant: KEY.startsWith("sk-ant-"), raw_len: String(env.ANTHROPIC_API_KEY).length } } : {}) }, 502, cors); }
  const m = await r.json(), tu = (m.content || []).find((c) => c.type === "tool_use" && c.name === "reply"), text = tu ? JSON.stringify(tu.input) : (m.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
  const out = parseModel(text, items); if (!out) return json({ error: "bad_model_output" }, 502, cors);
  return json({ ...out, model: m.model, usage: m.usage, data_time: nowIso }, 200, { ...cors, "Cache-Control": "no-store" });
}
export default { fetch: (req, env) => handle(req, env) };
