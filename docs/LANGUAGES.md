# Regional interface languages

Gati is written in Nepali and English. Many people in flood-prone districts read Nepali as a second language, so
Gati can show short interface words in a regional language on top of Nepali.

## How it works

- The choice is on the Profile and Settings page, under Language. It is stored in the browser only.
- The page stays in Nepali. `assets/js/locale.js` swaps short interface strings (menus, buttons, headings) that have
  a translation in `data/i18n/<code>.json`. Anything without a translation stays in Nepali.
- **Official alert text is never translated.** A warning is shown in the agency's own words. Translating it could
  change its meaning, and that is the agency's job, not Gati's.
- When the page is switched to English, the overlay is off.

## Status

| Language | Code | Status |
|---|---|---|
| Maithili | `mai` | Draft, shown as beta. Not yet checked by a native speaker. |
| Bhojpuri | `bho` | Draft, shown as beta. Not yet checked by a native speaker. |
| Tharu | `the` | Draft, shown as beta. Leans on Dangaura Tharu; about half the words are filled, the rest stay in Nepali until a native speaker supplies them. Not yet checked by a native speaker. |
| Nepal Bhasa (Newar) | `new` | Translators wanted. |
| Tamang | `taj` | Translators wanted. |

Draft packs cover about 40 common interface words. They were written without native review, so please correct them.

## Add or fix a language

1. Copy `data/i18n/template.json` to `data/i18n/<code>.json`. Keys are the Nepali strings; the `english` block is
   there to help and can be deleted.
2. Fill in the values. Leave a value empty to keep Nepali. Use the words people actually say locally.
3. Add or update the entry in `data/i18n/index.json`. Use `"status": "reviewed"` only when a native speaker has
   checked the whole file; `"draft"` is shown with a beta mark; `"wanted"` is not shown.
4. Open a pull request and say who reviewed it.

To translate a string that is not in the template, add its exact Nepali text as a new key.
