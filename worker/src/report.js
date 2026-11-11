/* Anonymous citizen report intake: POST /report -> a public GitHub issue created by a bot token.
   No account needed by the reporter. Contact details are never accepted. Photos are stripped of metadata
   and held privately for moderators; they are not published by this Worker. See worker/README.md. */

// Must match .github/ISSUE_TEMPLATE/report.yml and assets/js/report.js exactly.
export const HAZARDS = ["बाढी / Flood", "पहिरो / Landslide", "सडक अवरोध / Road blocked", "पुल क्षति / Bridge damage", "भारी वर्षा / Heavy rain",
  "हिमताल/हिमपहिरो / Glacial lake or avalanche", "भूकम्प / Earthquake", "आगलागी / Fire", "बिजुली/सञ्चार अवरोध / Power or telecom outage", "अन्य / Other"];
export const MAX_PHOTO_BYTES = 600 * 1024;
const MIN_FILL_MS = 4000;

const DEV = "०१२३४५६७८९";
const ascii = (s) => String(s).replace(/[०-९]/g, (d) => DEV.indexOf(d));

/* Remove contact details and anything that could notify or mislead on GitHub. */
export function scrub(s) {
  let t = String(s || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email removed]");
  t = t.replace(/(?:\+?[0-9०-९][0-9०-९\s-]{7,}[0-9०-९])/g, (m) => (ascii(m).replace(/\D/g, "").length >= 9 ? "[number removed]" : m));
  t = t.replace(/https?:\/\/\S+/gi, "[link removed]");
  t = t.replace(/</g, "&lt;").replace(/@/g, "@​").replace(/!\[/g, "[");
  return t.trim();
}
const line = (s, n) => scrub(s).replace(/\s+/g, " ").slice(0, n);

/* Returns { error } or { report } with every field cleaned. */
export function validReport(b) {
  if (!b || typeof b !== "object") return { error: "bad_json" };
  if (b.website) return { error: "rejected" };                                   // honeypot: people never see this field
  if (!(+b.elapsed >= MIN_FILL_MS)) return { error: "too_fast" };
  if (b.consent !== true) return { error: "consent" };
  if (!HAZARDS.includes(b.hazard)) return { error: "hazard" };
  const district = line(b.district, 80), description = scrub(b.description).slice(0, 2000);
  if (!district) return { error: "district" };
  if (description.length < 10) return { error: "description" };
  let gps = "";
  const m = String(b.gps || "").match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (m && Math.abs(+m[1]) <= 90 && Math.abs(+m[2]) <= 180) gps = `${(+m[1]).toFixed(4)}, ${(+m[2]).toFixed(4)}`;   // about 11 m, never finer
  const observed = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(String(b.observed || "")) ? String(b.observed).slice(0, 16).replace("T", " ") + " NPT" : "";
  if (!observed) return { error: "observed" };
  return { report: { hazard: b.hazard, district, municipality: line(b.municipality, 80), ward: ascii(line(b.ward, 3)).replace(/\D/g, ""),
    place: line(b.place, 120), gps, observed, description, lang: b.lang === "en" ? "en" : "ne" } };
}

/* Same headings as the GitHub issue form, so the Reports page reads both kinds the same way. */
export function issueFor(r, photoHeld) {
  const v = (x) => x || "_No response_";
  const en = (s) => s.split(" / ").pop();
  const body = [
    ["जोखिमको प्रकार / Hazard type", r.hazard], ["जिल्ला / District", r.district], ["नगर/गाउँपालिका / Municipality", r.municipality],
    ["वडा नं. / Ward no.", r.ward], ["ठाउँ / Place or landmark", r.place], ["GPS (lat, lon)", r.gps],
    ["देखेको समय / Time observed (NPT)", r.observed], ["के देख्नुभयो? / What did you see?", r.description],
  ].map(([k, x]) => `### ${k}\n\n${v(x)}`).join("\n\n")
    + "\n\n### सहमति / Consent\n\n- [x] यो रिपोर्ट सबैले देख्छन् भन्ने मलाई थाहा छ, र यो मैले आफैँ देखेको साँचो कुरा हो। I understand this report is public and it is a true account of what I saw."
    + "\n\n---\n_खाता बिना गतिको फारमबाट पठाइएको। पुष्टि भएको छैन। / Sent from the Gati form without an account. Not confirmed._"
    + (photoHeld ? "\n_तस्विर मोडेरेटरका लागि निजी रूपमा राखिएको छ। / A photo is held privately for moderators._" : "");
  return { title: `[Report] ${en(r.hazard)} — ${en(r.district)}${r.municipality ? ", " + r.municipality : ""}`.slice(0, 200), body, labels: ["reported", "citizen-report"] };
}

/* Drop every metadata segment from a JPEG (EXIF/GPS, XMP, ICC, comments). Returns null if the bytes are not a JPEG. */
export function stripJpeg(u8) {
  if (!(u8 instanceof Uint8Array) || u8.length < 4 || u8[0] !== 0xff || u8[1] !== 0xd8) return null;
  const out = [u8.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= u8.length) {
    if (u8[i] !== 0xff) return null;
    const mk = u8[i + 1];
    if (mk === 0xda) { out.push(u8.subarray(i)); i = u8.length; break; }          // start of scan: image data runs to the end
    const len = (u8[i + 2] << 8) | u8[i + 3];
    if (len < 2 || i + 2 + len > u8.length) return null;
    const meta = (mk >= 0xe1 && mk <= 0xef) || mk === 0xfe;                        // APP1..APP15 and COM; APP0 (JFIF) is kept
    if (!meta) out.push(u8.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  if (i !== u8.length) return null;
  const n = out.reduce((a, p) => a + p.length, 0), res = new Uint8Array(n);
  let o = 0; for (const p of out) { res.set(p, o); o += p.length; }
  return res;
}

export function decodePhoto(dataUrl) {
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m || m[1].length > MAX_PHOTO_BYTES * 1.4) return null;
  let bin; try { bin = atob(m[1]); } catch (e) { return null; }
  const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  if (u8.length > MAX_PHOTO_BYTES) return null;
  return stripJpeg(u8);
}

const json = (o, status, h) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...(h || {}) } });

async function turnstileOk(env, token, ip, fetcher) {
  if (!env.TURNSTILE_SECRET) return true;                                          // optional
  if (!token) return false;
  try {
    const r = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }) });
    return !!(await r.json()).success;
  } catch (e) { return false; }
}

/* POST /report */
export async function handleReport(req, env, cors, bump, fetcher = fetch) {
  const TOKEN = String(env.GITHUB_TOKEN || "").trim(), REPO = String(env.REPORT_REPO || "").trim();
  if (!TOKEN || !/^[\w.-]+\/[\w.-]+$/.test(REPO)) return json({ error: "not_configured" }, 503, cors);
  if (+(req.headers.get("Content-Length") || 0) > 1200000) return json({ error: "too_large" }, 413, cors);
  let b; try { b = await req.json(); } catch (e) { return json({ error: "bad_json" }, 400, cors); }
  const { error, report } = validReport(b);
  if (error) return json({ error }, 400, cors);
  const ip = req.headers.get("CF-Connecting-IP") || "0", now = new Date(Date.now() + 345 * 60000).toISOString();
  if (!(await turnstileOk(env, b.turnstile, ip, fetcher))) return json({ error: "challenge_failed" }, 403, cors);
  const hour = now.slice(0, 13), dayKey = now.slice(0, 10);
  if (!(await bump(env, `rh:${ip}:${hour}`, 3700, +env.REPORT_PER_IP_PER_HOUR || 3)) || !(await bump(env, `rd:${ip}:${dayKey}`, 90000, +env.REPORT_PER_IP_PER_DAY || 10)))
    return json({ error: "rate_limited" }, 429, { ...cors, "Retry-After": "3600" });
  if (!(await bump(env, `rcap:${dayKey}`, 90000, +env.REPORT_DAILY_CAP || 300))) return json({ error: "daily_cap" }, 429, cors);
  const photo = b.photo && env.KV ? decodePhoto(b.photo) : null;
  if (b.photo && env.KV && !photo) return json({ error: "photo" }, 400, cors);
  const issue = issueFor(report, !!photo);
  const r = await fetcher(`https://api.github.com/repos/${REPO}/issues`, { method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "gati-report-worker", "Content-Type": "application/json" },
    body: JSON.stringify(issue) });
  if (!r.ok) return json({ error: "upstream", status: r.status }, 502, cors);
  const made = await r.json();
  if (photo) await env.KV.put(`photo:${made.number}`, photo, { expirationTtl: (+env.PHOTO_KEEP_DAYS || 30) * 86400 });
  return json({ ok: true, number: made.number, url: made.html_url, photo: !!photo }, 201, cors);
}

/* GET /report/photo/<issue number>: moderators only (Authorization: Bearer MOD_TOKEN). */
export async function handlePhoto(req, env, number) {
  const want = String(env.MOD_TOKEN || ""), got = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!want || want.length < 16 || got.length !== want.length) return json({ error: "forbidden" }, 403);
  let diff = 0; for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ got.charCodeAt(i);
  if (diff || !env.KV) return json({ error: "forbidden" }, 403);
  const buf = await env.KV.get(`photo:${number}`, "arrayBuffer");
  if (!buf) return json({ error: "not_found" }, 404);
  return new Response(buf, { status: 200, headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "Content-Disposition": `inline; filename="report-${number}.jpg"` } });
}
