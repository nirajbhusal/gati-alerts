# Security policy

[नेपालीमा](SECURITY.ne.md)

Gati relays public safety information, so integrity matters more than anything else: a false or altered alert
could put people at risk.

## What to report privately

- Any way to make Gati show an alert, source, time or trust label that is not what the official agency published.
- Any way to inject script or content into the site, the feeds, the embed widget or the share images.
- Abuse of the "Ask Gati" Worker (bypassing limits, making it cite something that is not in Gati's data).
- Exposure of secrets, or of personal data of people who sent reports.

## How to report

Please do not open a public issue for these. Use either:

1. GitHub private vulnerability reporting:
   https://github.com/nirajbhusal/gati-alerts/security/advisories/new
2. The maintainer email on the [contact page](https://nirajbhusal.github.io/gati-alerts/contact/).

Include what you found, how to reproduce it, and what you think the impact is. This is a volunteer project; the
aim is to reply within 7 days and to fix confirmed problems that affect alert integrity before anything else.
Credit is given in the fix unless you prefer otherwise.

## Not a security issue

A wrong or outdated alert, a missing source, or a mistranslation is a content correction. Open a normal issue so
the correction is public and logged.

## Supported version

Only the live site (the `main` branch) is supported.
