# Play listing draft

Not submitted. Package id and signing are not confirmed. Do not paste this into Play Console until both are decided.

The app is an independent project by Niraj Bhusal. It is not an official app of the Government of Nepal, DHM, NDRRMA, NEOC, or Nepal Police.

## Identity

| Field | Draft |
|---|---|
| App name | गति Gati |
| Package name | `io.github.nirajbhusal.gati.alerts` (provisional) |
| Default language | Nepali (ne-NP) |
| Category | News & Magazines (confirm; there is no public-alert category) |
| Tags | news |
| Contact | GitHub repository `nirajbhusal/gati-alerts`. Do not list a personal phone number. |
| Website | https://nirajbhusal.github.io/gati-alerts/ |
| Privacy policy URL | Not published yet. Draft text is `privacy-policy.md` in this folder. Play blocks submission of an app that uses location until a public policy URL exists. |

Icon: `android/play/icon-512.png`, copied from the existing maskable mark. No new artwork.

## Short description (80 characters max)

Nepali:

आधिकारिक सूचनाको रिले। गति आफैँ चेतावनी जारी गर्दैन।

English:

Relay of official Nepal alerts. Gati does not issue warnings.

## Full description

Nepali:

गतिले नेपालका आधिकारिक सूचना रिले गर्छ। स्रोत र स्रोतको समय हरेक सूचनामा हुन्छ।

गति आफैँ चेतावनी जारी गर्दैन। यो नेपाल सरकारको आधिकारिक एप होइन। यो निरज भुसालको स्वतन्त्र परियोजना हो।

इन्टरनेट नभएको बेला अन्तिम बचत देखिन सक्छ। त्यो अहिलेको नहुन सक्छ।

सूचना एप खुला हुँदा मात्र देखिन्छ। एप बन्द हुँदा आउने पुस अझै छैन।

English:

Gati relays official notices for Nepal. Every item shows its source and its source time.

Gati does not issue warnings. This is not an official app of the Government of Nepal. It is an independent project by Niraj Bhusal.

Without internet you may see the last saved copy. That copy may be out of date.

Notifications show only while the app is open. Push while the app is closed is not available.

## What not to claim

- Do not say the app is verified, government, or partnered with an agency.
- Do not say Play has approved it.
- Do not say alerts arrive when the app is closed.
- Do not say the address bar is hidden. It stays until Digital Asset Links are hosted at `https://nirajbhusal.github.io/.well-known/assetlinks.json`.
- Do not add a personal phone number or email to the store listing.

## Data safety draft

Answer from the app's real behavior. Confirm in Play Console. This is not a completed form.

- Data is not sold.
- No ads. No account inside the app.
- Location: optional, collected only after the person taps a location control on the site. Used on the device to answer "am I affected" and to place a report pin. The app does not run location in the background. A citizen report, if the person submits one, opens GitHub with the coordinates the site already puts in that form (rounded). Gati has no server that stores location.
- Notifications: the person can turn on notifications while the app is open. Nothing is sent to a push service. Closed-app push is not built.
- App activity: Ask Gati, when used, sends the question and the language to the existing worker at `https://gati-ask.nirajbhusal.workers.dev/ask`. Map tiles may be requested from OpenStreetMap. Weather and air snippets in Ask Gati may be requested from Open-Meteo. Report counts are read from the public GitHub API. These are the same requests the website already makes.
- Data is encrypted in transit (HTTPS only).
- The person can remove the app. That removes the app's own notice flag. Site data kept by Chrome for this origin is removed with Chrome's site data for that origin, or when the app is uninstalled if Chrome stored it for the TWA.

## Content rating and audience

Not a children's app. Not directed at children under 13. Disaster text can include injury and death figures copied from official notices. Complete the IARC questionnaire in Play Console. Do not guess a final rating here.

## Graphics still needed before submission

- Phone screenshots from a signed build whose address-bar state you are willing to ship (7 inch and 10 inch tablets if you opt into those form factors).
- A feature graphic (1024x500). Do not generate one with an image model. Crop the existing `assets/img/brand/og-cover.png` only if you review it first.

This draft does not include those images.
