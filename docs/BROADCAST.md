# Broadcasting alerts to messaging apps and SMS

`scripts/broadcast.py` posts each new official alert once to the channels you have set up. It is run by
`.github/workflows/broadcast.yml` whenever `data/alerts.json` changes on `main`, and twice an hour as a safety net.
Until you add secrets it does nothing.

## Rules built into the script

- Only alerts with trust level **Official** are sent. Citizen reports, verified reports and model data never are.
- The agency's own headline and instruction are sent unchanged, with the source, the source time, the official link
  and the Gati permalink. Every message says Gati relays and does not issue warnings.
- Only active alerts first sent in the last 48 hours are considered. Expired ones are skipped.
- A channel's **first run sends nothing**: it records the alerts that already exist, so old alerts are not flooded out.
- A failed send is retried on the next run. One channel failing does not stop the others.
- Tokens and phone numbers are read from secrets and never printed in logs.

## What each channel can do

| Channel | How it posts | Default minimum severity | Notes |
|---|---|---|---|
| Telegram | Bot posts to a public channel | Minor | Fully automatic and free. Start here. |
| Viber | Channels Post API to a Viber Channel | Minor | Free. Popular in Nepal. |
| WhatsApp | Cloud API template message to a list of opted-in numbers | Severe | **WhatsApp Channels cannot be posted to by any API.** This sends to a list you maintain. Meta charges per message. |
| SMS | HTTP gateway (defaults fit Sparrow SMS) to a list of numbers | Severe | Costs per message. Nepali text is about 70 characters per SMS part. |

Road notices with no severity are not broadcast. Change a floor with a repository variable such as
`TELEGRAM_MIN_SEVERITY` = `Moderate` (values: Minor, Moderate, Severe, Extreme).

## Set up

Add these in the repository's Settings → Secrets and variables → Actions.

**Telegram**
1. Create a bot with @BotFather and copy its token → secret `TELEGRAM_BOT_TOKEN`.
2. Create a public channel, add the bot as an administrator → secret `TELEGRAM_CHAT_ID` (for example `@gatialerts`).

**Viber**
1. Create a Viber Channel. In its settings, open Developer Tools and copy the token → secret `VIBER_AUTH_TOKEN`.
2. Viber needs the super admin's user id as the sender. Get it with the `get_account_info` call described in Viber's
   Channels Post API documentation → secret `VIBER_FROM`. Viber also asks for a webhook to be set once before posting.

**WhatsApp**
1. Create a Meta developer app with WhatsApp, and a business phone number → secrets `WHATSAPP_TOKEN`,
   `WHATSAPP_PHONE_NUMBER_ID`.
2. Get a template approved, named `gati_alert` (or set variable `WHATSAPP_TEMPLATE`), language Nepali, with three
   body variables in this order: headline, source agency, link. For example:
   `{{1}}` / `स्रोत: {{2}}` / `पूरा सूचना: {{3}}` / `गतिले आधिकारिक सूचना मात्र प्रसारण गर्छ।`
3. Secret `WHATSAPP_RECIPIENTS`: comma-separated numbers in international format, **only people who asked to receive
   alerts**. Good first recipients are ward offices, local disaster committees and community radio.
4. For the public, keep posting to your WhatsApp Channel by hand, or use the share buttons on each alert.

**SMS**
1. Get an account and sender identity from an SMS provider → secrets `SMS_TOKEN`, `SMS_FROM`.
2. Secret `SMS_RECIPIENTS`: comma-separated numbers of people who asked to receive alerts.
3. If your provider is not Sparrow SMS, set variable `SMS_API_URL`. The script sends form fields `token`, `from`,
   `to`, `text`; a provider with other field names needs a small change in `send_sms`.

The Viber, WhatsApp and SMS calls follow each provider's published API but have only been tested against mocks.
Do one manual run and check the result before relying on a channel.

## Try it

```bash
python scripts/broadcast.py --dry-run                     # print what would be sent; sends and saves nothing
python -m unittest discover scripts/tests                 # tests
```

Then, in the Actions tab, open "Broadcast alerts" and press "Run workflow":

1. **Test first.** Tick the "test" box and run. It posts one message labelled "Test message" to Telegram and Viber and
   changes nothing else. If it fails, the bot is not an administrator of the channel, or a secret is wrong.
2. **Then a normal run** (box unticked). The first normal run only records a baseline and sends nothing. From then on
   each new official alert is posted once.

## Where the record is kept

What was sent, per channel, is committed to the `bot/broadcast-state` branch (`broadcast-state.json`). It is a public
log of alert identifiers and times; it holds no phone numbers. If the state cannot be saved the run stops before
sending, so a storage problem cannot cause repeated messages.

## Personal data

`WHATSAPP_RECIPIENTS` and `SMS_RECIPIENTS` are phone numbers. Keep only numbers whose owners asked to be included,
remove a number as soon as its owner asks, and keep the list only in GitHub secrets. Update [PRIVACY.md](../PRIVACY.md)
when you first switch one of these channels on.

## Not built yet

- Self-service subscription (people adding and removing their own number) and per-district lists.
- Incoming SMS or voice-call reports. Both need a short code and a telecom partner.
