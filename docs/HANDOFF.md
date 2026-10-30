# Liveteck website: handoff

Last updated: 2026-10-30

## State
Client change list (Oct 2026 PDF + chat) is coded, builds clean (`npm run build`), browser-tested on localhost (desktop 1536 + phone 390 frames). **Committed locally (e776b01, 2026-10-30), not pushed, not deployed.**

Done in code:
- Home stats + hero numbers are links (story / products / #range / #thickness, the 25 mm one opens the guide on 25 mm).
- "The range": the pinned scroll-sideways section was replaced by an endless auto-gliding row (`initRange` in `src/js/pages/home.js`): pauses on hover/touch/focus, drag/swipe, arrows, pause button, reduced-motion = swipe row.
- Product cards with 2+ photos cycle on their own (components.js "Card slideshows").
- Thickness guide tours 6→25 mm on its own; plies grow smoothly, number counts up, timer bar on the active tab, pause button.
- Why Liveteck cards, About brand-value cards, Who-we-serve rows, products compare table + plywood/block board cards are links.
- FAQ (`src/js/core/faq.js`): hover opens smoothly on desktop, click pins, tap on phones.
- Cross-page `#section` links land correctly (app.js waits for the pinned scenes).
- Key features: categories now hold shared `features` (shown first on every product). Plywood = Lifetime warranty, 100% Gurjan face veneer, BWP grade, Calibrated ply, Fire retardant, Termite proof, Borer proof, Selected timber, 4 times press (all plywood identical). Block boards / flexi / flush doors also get warranty + Gurjan face veneer; laminates & veneers get warranty only (client chose this). Editable in admin → Categories.
- **Live data:** a one-time migration (`runMigrations` in `src/js/admin/store.js`, id `features-2026-10`) writes these features to Firestore the first time the owner signs in to /admin after deploy. Until then the live site shows the old feature lists.
- Founder photo: admin → Settings → "Founder photo" (Cloudinary upload); About founder card shows it (falls back to the logo card).
- SEO: ROOT CAUSE was every canonical/og:url/sitemap/robots pointing to liveteck-website.vercel.app (SITE_URL unset). Default now https://www.liveteckply.com, vercel.app 301s to www (vercel.json). Keyword titles/descriptions per page, en-IN, LocalBusiness(HardwareStore) + WebSite graph, breadcrumbs, FAQPage (products + contact), products page has prerendered catalogue HTML + ItemList, internal links go to clean URLs in production, new products-page buyer FAQ.

## Next steps
1. Founder photo: client/user to approve `D:\all\liveteck\media\founder\03-picked\liveteck_founder-portrait_about_4x5_v04_20261030.png` (v03 = fallback; prompts in `media/founder/prompts.md`). Then upload it in admin → Settings → Founder photo → Save (or set `SETTINGS.founderPhoto` default in defaults.js to its Cloudinary URL).
2. Deploy only with the user's OK (Vercel). In Vercel, SITE_URL can stay unset or be `https://www.liveteckply.com`.
3. After deploy: owner signs in to /admin once (applies the key-feature migration; toast confirms). Check a plywood card shows "Lifetime warranty · 100% Gurjan face veneer · BWP grade".
4. SEO off-site (user/client actions): Google Search Console for www.liveteckply.com (submit sitemap, request indexing, remove/redirect the vercel.app property), Google Business Profile (category "Plywood supplier", link website, photos, ask customers for reviews), add social links in admin Settings. Settings map embed still points at "Rajendra Glass & Plywoods" (admin warns): replace with the verified Liveteck pin.
5. Optional SEO growth: one indexable landing page per category (/plywood-kakinada etc.) instead of #anchors.

## Gotchas
- Playwright is NOT installed globally on this PC; tests were done in the connected Chrome profile (hidden tabs run at ~2 fps, so motion looks slow there; it's time-based code).
- `dist/` reads are blocked for tools; use a node script (see scratchpad pattern) to inspect the build.
- Live product data lives in Firestore (`liveteck-3fd57`) and wins over `defaults.js`; firebase CLI is not logged in.
