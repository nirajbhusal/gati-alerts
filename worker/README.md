# Ask Gati Worker

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
MODEL (default claude-haiku-4-5), MAX_TOKENS, ALLOWED_ORIGINS, MAX_QUESTION_CHARS, PER_IP_PER_MIN, PER_IP_PER_DAY, DAILY_CAP.

## Test
`cd worker && npm test` (node:test, Claude and data fetches mocked).
