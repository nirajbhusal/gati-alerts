/* Background worker: checks Gati every 15 minutes, keeps the toolbar badge current and, if the reader
   turned them on, shows a notification for an alert it has not shown before. */
importScripts("shared.js");
const ALARM = "gati-check", EVERY_MIN = 15;

async function check(firstRun) {
  const st = await getStore(["district", "notify", "seen", "lang"]);
  let data;
  try { data = await loadJson("data/alerts.json"); } catch (e) { await setStore({ lastError: String(e), lastTried: Date.now() }); return; }
  const list = activeAlerts(data, st.district || ""), count = list.filter(named).length;
  const top = list.filter(named)[0];
  chrome.action.setBadgeText({ text: count ? String(count) : "" });
  chrome.action.setBadgeBackgroundColor({ color: top ? (SEV[top.severity] || SEV.Unknown)[2] : "#6B7280" });
  chrome.action.setTitle({ title: count ? `Gati: ${count} active alert${count > 1 ? "s" : ""}` : "Gati: no active district alert" });
  const seen = new Set(st.seen || []), fresh = list.filter((a) => !seen.has(a.identifier));
  /* never notify for everything at once on install: the first check only records what is there */
  if (st.notify && !firstRun && st.seen) {
    const lang = st.lang === "en" ? "en" : "ne";
    fresh.slice(0, 3).forEach((a) => { const i = a.info[lang] || a.info.ne || a.info.en;
      chrome.notifications.create(a.identifier, { type: "basic", iconUrl: "icons/icon-128.png", title: agencyOf(a, lang) + " · " + (SEV[a.severity] || SEV.Unknown)[lang === "ne" ? 0 : 1],
        message: i.headline, contextMessage: lang === "ne" ? "गति मार्फत प्रसारित" : "Relayed by Gati", priority: (SEV[a.severity] || SEV.Unknown)[3] >= 3 ? 2 : 0 }); });
  }
  await setStore({ seen: list.map((a) => a.identifier).concat([...seen]).slice(0, 300), lastOk: Date.now(), lastError: "", generated: data.generated });
}

chrome.runtime.onInstalled.addListener(() => { chrome.alarms.create(ALARM, { periodInMinutes: EVERY_MIN }); check(true); });
chrome.runtime.onStartup.addListener(() => { chrome.alarms.create(ALARM, { periodInMinutes: EVERY_MIN }); check(false); });
chrome.alarms.onAlarm.addListener((a) => { if (a.name === ALARM) check(false); });
chrome.notifications.onClicked.addListener((id) => { chrome.tabs.create({ url: SITE + "alerts/" + id + "/" }); chrome.notifications.clear(id); });
chrome.runtime.onMessage.addListener((m, s, reply) => { if (m === "check") { check(false).then(() => reply(true)); return true; } });
