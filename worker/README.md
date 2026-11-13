# Gati Worker

Two routes in one Worker: Ask Gati (`/ask`) and the no-account report intake (`/report`).

## Ask Gati

POST `/ask` with `{"q": "..."}` returns `{answer, citations:[{id,title,title_ne,agency,trust,url,time}], model, data_time}`.
The Worker fetches Gati's live JSON, gives Claude a numbered list of official items, and maps the ids Claude cites back to real links, so citations cannot be invented.

## Deploy once
1. `cd worker && npx wrangler login` (or set CLOUDFLARE_API_TOKEN with the "Edit Cloudflare Workers" template plus Workers KV Storage: Edit).
2. `npx wrangler kv namespace create GATI_ASK_KV` and paste the id into `wrangler.toml`.
3. `npx wrangler secret put ANTHROPIC_API_KEY` (paste the key; it is never in the repo or the site).
4. `npx wrangler deploy` and note the URL, for example `https://gati-ask.<account>.workers.dev`.
5. Put `https://gati-ask.<account>.workers.dev/ask` in `data/ask-config.json` "worker" and publish the site.

Or copy worker/deploy-ask-worker.yml.example to .github/workflows/deploy-ask-worker.yml (needs a push with workflow scope) and run the manual Action "Deploy Ask Gati Worker" with repo secrets CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, ANTHROPIC_API_KEY (steps 2 and 5 still needed once).

## Settings (wrangler.toml [vars])
MODEL (default claude-haiku-5-5), MAX_TOKENS, ALLOWED_ORIGINS, MAX_QUESTION_CHARS, PER_IP_PER_MIN, PER_IP_PER_DAY, DAILY_CAP.

## Report intake (send without a GitHub account)

POST `/report` with the form fields creates a public GitHub issue labelled `reported` and `citizen-report`, in the same
layout as the issue form, and returns `{ok, number, url, photo}`. It is off (503) until `GITHUB_TOKEN` is set.

What it does to protect people:
- Takes no name, phone or email. Phone numbers, emails and links typed into the text are removed, and `@` cannot notify anyone.
- Rounds GPS to 4 decimals. Limits each IP to 3 reports an hour and 10 a day, with a daily cap for the whole site.
- A hidden field and a minimum fill time stop simple bots. Cloudflare Turnstile is optional.
- A photo is never published. The browser re-draws it, the Worker strips all JPEG metadata again, and it is kept in KV for
  30 days for moderators only.

Set up once:
1. Create a fine-grained GitHub token for this repository only, with **Issues: Read and write** and nothing else.
   `npx wrangler secret put GITHUB_TOKEN`.
2. `npx wrangler secret put MOD_TOKEN` (a long random string, 16+ characters) so moderators can fetch held photos:
   `curl -H "Authorization: Bearer <MOD_TOKEN>" https://gati-ask.<account>.workers.dev/report/photo/<issue number> -o photo.jpg`.
3. `npx wrangler deploy`.
4. Put `https://gati-ask.<account>.workers.dev/report` in `data/report-config.json` "worker" and publish the site.
5. Optional: create a Turnstile widget, `npx wrangler secret put TURNSTILE_SECRET`, and put the site key in
   `data/report-config.json` "turnstileSiteKey". This loads one Cloudflare script on the report page only.

Settings: REPORT_REPO, REPORT_PER_IP_PER_HOUR, REPORT_PER_IP_PER_DAY, REPORT_DAILY_CAP, PHOTO_KEEP_DAYS.

Because these issues are public as soon as they are created, watch the first days closely and lower the limits or
turn on Turnstile if the route is abused. Removing the URL from `data/report-config.json` switches it off on the site.

## Test
`cd worker && npm test` (node:test; Claude, GitHub and data fetches mocked).
