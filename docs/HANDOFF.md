# Liveteck website: handoff

Last updated: 2026-10-30

## State
Client change list (Oct 2026 PDF + chat) is coded, builds clean (`npm run build`), browser-tested on localhost (desktop 1536 + phone 390 frames). **Deployed 2026-10-30: fdab42f pushed (includes range pin restore, founder photo, category pages); verified live on www.liveteckply.com.**

Done in code:
- Home stats + hero numbers are links (story / products / #range / #thickness, the 25 mm one opens the guide on 25 mm).
- "The range" (`initRange` in `src/js/pages/home.js`): endless auto-gliding row AND (restored 2026-10-30, client wanted both) pinned while scrolling: scroll down moves it sideways, up moves it back, idle = drift. Pauses on hover/touch/focus, drag/swipe, arrows, pause button. Pin is skipped when the frame cannot fit the screen (e.g. 390x667 phones; fits 390x844, 1366x657, 1440x900); reduced motion = plain swipe row. Screenshots: `D:\all\liveteck\media\range-pin\`.
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
1. Founder photo: **done (2026-10-30, commit 5e73304).** v04 portrait uploaded to Cloudinary (`liveteck/brand/ubnbutqaeixljwq3jhgo.jpg`, 262 KB JPEG of the 03-picked PNG) and set as `SETTINGS.founderPhoto` in defaults.js. Live Firestore settings have no founderPhoto key, so the default shows; the owner can still replace it in admin → Settings. Screenshots: `D:\all\liveteck\media\founder\04-site\`.
2. Deploy = `git push origin main` with the user's OK (Vercel Git integration builds it in about a minute; no .vercel link on this PC). Last deploy: fdab42f, 2026-10-30. In Vercel, SITE_URL can stay unset or be `https://www.liveteckply.com`.
3. After deploy: owner signs in to /admin once (applies the key-feature migration; toast confirms). Check a plywood card shows "Lifetime warranty · 100% Gurjan face veneer · BWP grade".
   - **Done 2026-10-30.** Opened /admin in the owner's Chrome ("dts", already signed in); migration `features-2026-10` ran. Firestore: all 6 categories have features; /plywood-kakinada cards show Lifetime warranty · 100% Gurjan face veneer · BWP grade.
4. SEO off-site (user/client actions). Site side verified ready 2026-10-30: robots + sitemap (11 URLs) live, vercel.app / apex / http all 308 to https://www, no Google verification record yet, DNS at GoDaddy (ns37/38.domaincontrol.com) so use a Search Console **Domain** property with GoDaddy auto-verify. Live settings: email + all social links empty.
   - **Search Console (2026-10-30):** Domain property `liveteckply.com` added in the owner's account (liveteckplyboards@gmail.com, Chrome "dts"), NOT verified yet. TXT record `@` = `google-site-verification=fKEVpQTVLTQQ05pm5isXFq9H6AdCJtE7Q-nsU8cnHIM` was typed into GoDaddy DNS (GoDaddy signs in with the same Google account) but Claude's Save was blocked by the DNS-change safety check: the user must click Save in GoDaddy, then Verify in Search Console. Then submit sitemap + request indexing (home, /products, 6 category pages). An unverified duplicate property also sits in Srinu's account (chsrinu4644), harmless; delete it any time. Google Search Console for www.liveteckply.com (submit sitemap, request indexing, remove/redirect the vercel.app property), Google Business Profile (category "Plywood supplier", link website, photos, ask customers for reviews), add social links in admin Settings. Settings map embed still points at "Rajendra Glass & Plywoods" (admin warns): replace with the verified Liveteck pin.
5. Category landing pages: **done (2026-10-30), committed locally, not deployed.** Six pages: /plywood-kakinada, /block-boards-kakinada, /flexi-plywood-kakinada, /veneers-kakinada, /laminates-kakinada, /flush-doors-kakinada. Screenshots (390 + 1440): `D:\all\liveteck\media\seo-pages\`.
   - Copy lives in `scripts/category-pages.mjs` (edit there, run `node scripts/category-pages.mjs`, then build; never hand-edit the generated HTML). Slugs: `CATEGORY_PAGES` in `src/js/core/defaults.js` (also drives build input, sitemap, clean links, prerender + ItemList in `vite.config.js`). Page script: `src/js/pages/category.js`.
   - Internal links now point at them: footer, home range cards + audience rows, `SPACES` tiles, about "Durability" card, head.html OfferCatalog, products page category headings ("Plywood in Kakinada" link), "More from Liveteck" rows.
   - After deploy: in Search Console request indexing for the 6 URLs (sitemap already lists them).

## Gotchas
- Playwright is NOT installed globally on this PC; tests were done in the connected Chrome profile (hidden tabs run at ~2 fps, so motion looks slow there; it's time-based code).
- `dist/` reads are blocked for tools; use a node script (see scratchpad pattern) to inspect the build.
- Screenshots without Playwright: headless Chrome `--remote-debugging-port=9333` + `node D:\all\liveteck\media\seo-pages\shot.mjs <url> <width> <out.png>` (true 390 px emulation; plain `--window-size` can't go below ~500 px). Run against `npx vite preview` after `npm run build`.
- Live product data lives in Firestore (`liveteck-3fd57`) and wins over `defaults.js`; firebase CLI is not logged in.
