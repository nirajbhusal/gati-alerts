# Chrome Web Store listing: Gati

Everything to paste into the developer dashboard. Images are in this folder.

## Store listing tab

**Name** (from the package): Gati: Nepal alerts · गति: नेपालका सूचना

**Summary** (from the package, 132 characters at most):
Official disaster and weather alerts for Nepal, relayed with source and time. Nepali and English.

**Category:** News & Weather (if not offered, choose Tools)

**Language:** English (default), plus Nepali

**Description (English):**

Gati puts Nepal's official disaster and weather alerts in your browser toolbar.

• Active alerts for your district, or for all of Nepal
• The Department of Hydrology and Meteorology's 5-day weather warning, day by day
• A badge on the toolbar button when an alert names your district
• Optional notifications for new alerts (off until you turn them on)
• Quick links to the map, road status, airport weather and emergency numbers
• Nepali or English, with every time shown in Nepal time

Every item shows the agency that issued it and when. Only notices from official agencies (such as DHM, Nepal Police, NDRRMA, the National Seismological Centre and USGS), or reports Gati has verified, are shown.

Gati does not issue warnings. It is an independent citizen project that relays official agencies' notices with their source and time. It is not a government system. In an emergency call 100 (police), 101 (fire), 102 (ambulance) or 1234 (disaster).

Privacy: the extension reads two public files from the Gati website and nothing else. Your district and language stay in your browser. There is no account, no analytics, no advertising and no tracking, and it cannot read the websites you visit.

Open source: https://github.com/nirajbhusal/gati-alerts

**Description (Nepali):**

गतिले नेपालका आधिकारिक विपद् र मौसम सूचना हजुरको ब्राउजरको टुलबारमै ल्याउँछ।

• हजुरको जिल्ला वा देशभरका सक्रिय सूचना
• जल तथा मौसम विज्ञान विभागको ५ दिने मौसम चेतावनी, दिन-दिनको
• हजुरको जिल्लाको नाम भएको सूचना आउँदा टुलबारको बटनमा सङ्ख्या
• नयाँ सूचनाको नोटिफिकेसन (हजुरले खोलेपछि मात्र)
• नक्सा, सडकको अवस्था, विमानस्थलको मौसम र आपतकालीन नम्बरका लिङ्क
• नेपाली वा अङ्ग्रेजी; सबै समय नेपालको समयमा

हरेक सूचनामा जारी गर्ने निकाय र समय देखिन्छ। आधिकारिक निकाय (जस्तै DHM, नेपाल प्रहरी, NDRRMA, राष्ट्रिय भूकम्प मापन केन्द्र र USGS) का सूचना वा गतिले प्रमाणित गरेका रिपोर्ट मात्र देखाइन्छन्।

गतिले आफैँ चेतावनी जारी गर्दैन। यो आधिकारिक निकायका सूचना स्रोत र समयसहित प्रसारण गर्ने स्वतन्त्र नागरिक परियोजना हो; सरकारी प्रणाली होइन। आपत्कालमा १०० (प्रहरी), १०१ (दमकल), १०२ (एम्बुलेन्स) वा १२३४ (विपद्) मा फोन गर्नुहोस्।

गोपनीयता: एक्स्टेन्सनले गतिको वेबसाइटबाट दुई सार्वजनिक फाइल मात्र पढ्छ। हजुरको जिल्ला र भाषा हजुरकै ब्राउजरमा रहन्छ। खाता, विश्लेषण, विज्ञापन वा ट्र्याकिङ छैन, र हजुरले खोलेका वेबसाइट यसले पढ्न सक्दैन।

**Graphics**
- Store icon, 128×128: `../icons/icon-128.png`
- Screenshots, 1280×800: `screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png`
- Small promo tile, 440×280: `promo-small-440x280.png`
- Marquee promo tile, 1400×560: `promo-marquee-1400x560.png`

**Additional fields**
- Official URL / homepage: https://nirajbhusal.github.io/gati-alerts/
- Support URL: https://github.com/nirajbhusal/gati-alerts/issues

## Privacy practices tab

**Single purpose:**
Shows official disaster and weather alerts for Nepal, from the Gati website, in the browser toolbar.

**Permission justifications**
- `alarms`: to check the Gati website for new alerts every 15 minutes, so the toolbar badge stays current.
- `storage`: to remember the district and language the user chose, whether notifications are on, and which alerts have already been shown. Stored only in the browser.
- `notifications`: to show a new alert once, only if the user has turned notifications on in the popup.
- Host permission `https://nirajbhusal.github.io/gati-alerts/*`: to read Gati's two public data files (`data/alerts.json` and `data/weather.json`). No other site is accessed.

**Remote code:** No, the extension does not use remote code. All scripts are in the package; it only fetches JSON data.

**Data usage:** the extension does not collect or use any user data. Tick none of the data categories.

**Certifications (tick all three):**
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://nirajbhusal.github.io/gati-alerts/privacy/#extension

## Distribution tab
- Visibility: Public
- Regions: All regions
- Pricing: Free

## Steps
1. Register at https://chrome.google.com/webstore/devconsole (one-time US$5 fee to Google) and verify the contact email.
2. "New item" → upload `assets/downloads/gati-chrome-extension.zip`.
3. Fill in the three tabs from this file and upload the images.
4. "Submit for review". Review usually takes a few days.
5. For an update: raise `version` in `manifest.json`, run `python3 scripts/make_extension.py`, upload the new zip.
