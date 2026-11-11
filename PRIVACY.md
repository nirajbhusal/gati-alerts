# Privacy policy

Last updated: 2026-11-11. This describes the live site at https://nirajbhusal.github.io/gati-alerts/ and the code
in this repository. A fork run by someone else must publish its own policy.

## In short

- No accounts, no cookies, no analytics, no advertising, no tracking.
- Gati has no database of its users. The site is static files.
- Your settings stay in your own browser.

## What stays on your device

The site saves your choices in the browser's local storage: language, theme, chosen district, watched places,
which notifications you have read, calendar view, regional interface language and similar preferences. A service worker keeps an offline copy
of pages and data, and of map tiles you have already looked at. None of this is sent to Gati. Clearing site data in your browser removes it.

## Location

Location is used only when you press a button that asks for it, and only after your browser asks your permission.

- Finding your district, nearby services and your position on the map is worked out in your browser.
- The "Am I affected" check asks Open-Meteo for air quality at a point, with coordinates rounded to three
  decimals (about 100 m).
- On the report form, your position is rounded to four decimals (about 11 m) and is placed in the report only if
  you submit it.

## Requests to other services

Your browser contacts these services directly, so they see your IP address as any website would:

| Service | When | What is sent |
|---|---|---|
| GitHub Pages | Every page | Standard web request. GitHub hosts the site and keeps its own server logs. |
| GitHub API | Home and Reports pages | A request for public report issues. |
| OpenStreetMap tile servers | Pages with a map | The map tiles for the area you view. |
| Open-Meteo | Weather, air quality and "Am I affected" | Coordinates of a place (see Location). |
| Ask Gati Worker (Cloudflare) | Only when you send a question in Ask Gati | Your question text and language. |
| Report Worker (Cloudflare) | Only if you press "Send without an account" | The report you wrote, and a photo if you added one. |

Fonts and the map library are served from Gati itself, not from a third party.

## Ask Gati

When you send a question, it goes to a small Cloudflare Worker that passes it, together with Gati's public alert
data, to Anthropic's API to write an answer with citations. The Worker does not store questions. It keeps short
counters keyed by IP address to limit abuse; they expire within about a day. Cloudflare and Anthropic process the
request under their own terms. Do not put personal details in a question. If the Worker is not configured, Ask
Gati answers from local data and nothing is sent.

## Citizen reports

There are two ways to send a report. Both create a **public GitHub issue**.

**With your GitHub account.** Your GitHub username, the text, the location and any photos you attach are public and
are handled by GitHub under its terms.

**Without an account** (offered only when the report Worker is switched on). No name or contact is taken. The
Worker removes phone numbers, emails and links from the text and rounds the location to about 11 m. Your IP address
is used only for short abuse counters that expire within about a day; it is not stored with the report or sent to
GitHub. A photo is redrawn in your browser, has its hidden data (such as GPS position) stripped, is **not published**,
and is kept for moderators for 30 days and then deleted.

- The form does not ask for a phone number or email, and none is put into the issue.
- If you write to the maintainer by email about a report, that email is used only for follow-up and then deleted.
- Moderators may coarsen a location that points at a private home, and the Reports page hides emails and phone
  numbers found in report text.
- To have a report or a detail removed, comment on the issue or write to the maintainer.

## Messaging channels and SMS

If you follow Gati's Telegram or Viber channel, that service knows you follow it; Gati does not receive a list of
followers' details. WhatsApp and SMS alerts, where switched on, go only to numbers whose owners asked for them; the
list is kept in a private secret store and a number is removed on request.

## Push notifications

Browser push by district is built but not switched on. Nothing is sent to any server. If it is enabled later, this
policy will be updated first: it would store a push subscription and a district, and nothing else.

## Children, sale of data, profiling

Gati does not knowingly collect data from anyone, sells nothing, and does no profiling.

## Law

Gati is run by an individual in Nepal and aims to follow Nepal's Individual Privacy Act 2075 (2018) and, for
visitors from elsewhere, the principles of the EU GDPR: collect the minimum, say what happens, delete on request.

## Contact

Privacy questions and removal requests: the maintainer email on the
[contact page](https://nirajbhusal.github.io/gati-alerts/contact/), or a GitHub issue if the matter is not private.
