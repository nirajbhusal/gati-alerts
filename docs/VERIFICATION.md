# Verification workflow

Gati shows citizen information only with a trust label. Official notices are relayed as **Official**; everything
else starts as **Reported** and must earn **Verified**.

## What counts as a source

- **Sources are the mandated agencies and their own channels**: DHM, NDRRMA, NEOC, Nepal Police, the Department
  of Roads, NSC, BIPAD, district and local government offices, and the international bodies listed in
  `data/sources.json`.
- **News portals are not sources.** A news article, in Nepal or abroad, is never the source of a Gati item and is
  never linked as one, even when it quotes an agency. Find the agency's own notice and link that. If the agency
  has published nothing, Gati publishes nothing as Official.
- A news report may prompt a moderator to go and check the agency. It does not count as corroboration in the steps
  below.
- Weather models (Open-Meteo, ECMWF and similar) are context, always labelled "Model", never a warning.

## Labels (GitHub issue labels = trust states)

| Label | Public? | Meaning |
|---|---|---|
| `reported` | No: the Gati reports page shows only a count of pending reports (the issue itself is public on GitHub) | Default for every new citizen report (set by the issue form) |
| `verified` | Yes, with Verified badge | Moderator confirmed by one of the routes below |
| `corrected` | Yes, with Corrected badge and a comment explaining the change | Details changed after new information |
| `retracted` | No (excluded from the list) | False, recycled or misleading |
| `unverified` | No (remove `reported`) | Spam, off-topic, duplicate, no detail, or unsafe content |
| `official` | — | Used for relayed agency notices tracked as issues |
| `citizen-report` | — | Marks issues from the report form |

## Steps for a moderator

1. **Triage (target: within 30 min in an active event).** Remove personal data (phone numbers, names of private
   people, faces of victims, exact home locations) by editing the issue. If the report is spam/unsafe: remove
   `reported`, add `unverified`, close.
2. **Check for a life-safety need.** If someone is in danger, call or tell 100 / 101 / 102 / 1234 and the District
   Emergency Operation Centre. Gati is not a rescue channel.
3. **Corroborate.** Mark `verified` only if at least one holds:
   - **Two or more independent reports** of the same hazard at the same place (same ward or ≤ 1 km) within a
     reasonable time window (≤ 6 h for floods/landslides, ≤ 24 h for road blocks), from different reporters, not
     copies of the same photo or post;
   - **Sensor confirmation**: an official DHM gauge / rain gauge or other registered sensor shows a consistent reading (link it);
   - **Official confirmation**: DHM, NDRRMA, NEOC, Nepal Police, DAO/DEOC, the municipality or ward office confirms (link or note who, when).
   Record the evidence in a comment: what, who, when (NPT), link.
4. **Photo check.** Reverse-image search for old/recycled images; check weather and river state fit the claim.
5. **Publish or correct.** If an official notice exists, relay *that* as a CAP message (`trustLevel=Official`), and
   link the issue. A verified citizen report may be added as CAP with `trustLevel=Verified` and severity no higher
   than the official picture supports. Gati never upgrades a citizen report into an official warning.
6. **Corrections and retractions** are public: add `corrected` or `retracted` and a comment; for CAP, publish an
   `Update` or `Cancel` with `<references>`. Never silently delete.
7. **Close** when the hazard is over or superseded; closed issues drop off the Reports page.

## Privacy

- The report form never sends contact details to GitHub; optional contact goes privately by e-mail to the maintainer and is deleted after follow-up.
- GPS is captured on the device, rounded to 4 decimals (~11 m). Moderators may coarsen it further if it points at a private home.
- Reports page scrubs e-mails and phone numbers before display as a second safeguard.
- No analytics, cookies or ads.
