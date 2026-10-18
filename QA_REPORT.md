# QA Report — Liveteck Ply & Boards website

Senior QA / UX / front-end pass over the public site (Home, About, Products, Testimonials, Contact) and the admin dashboard.

- **Builds tested:** the dev server (`npm run dev`) and the production build (`npm run build` → `npm run preview`).
- **Viewports:** 1920×1080, 1366×768, 768×1024, 390×844 and 360×640.
- **Admin flows:** run only against the local Firebase emulators with throwaway accounts. The real admin account was never used.

**Severity:**
- **Critical:** broken or unusable.
- **High:** hurts users or business goals.
- **Medium:** noticeable defect.
- **Low:** polish.

**Status:**
- **Open**
- **Fixed:** changed, not yet re-tested.
- **Verified:** re-tested after the fix.
- **Needs client input**

---

## Lighthouse (mobile unless noted)

Lighthouse 12.8 ran against `vite preview` with default mobile settings (simulated Moto G Power, slow 4G, 4× CPU).

**Measurement caveat:** the test machine was heavily loaded by other processes. Its benchmark index was about 800, against 1,500 or more for a typical desktop, and free RAM was often below 0.5 GB. That inflates TBT and FCP.
- **Loading metrics** (CLS and LCP relative to FCP) were cross-checked with a separate 4× CPU trace harness, which is more stable.
- **Re-check after deploy:** run PageSpeed Insights once the site is deployed.

### Round 0 — baseline (before QA)

| Page | Perf | A11y | BP | SEO | LCP | TBT | CLS | Desktop Perf / A11y / BP / SEO |
|---|---|---|---|---|---|---|---|---|
| Home | 27 | 95 | 100 | 100 | 6.47 s | 4,113 ms | 0.073 | 93 / 95 / 100 / 100 |
| About | 33 | 94 | 100 | 100 | 5.79 s | 3,791 ms | 0.003 | 89 / 94 / 100 / 100 |
| Products | 58 | 95 | 100 | 100 | 5.27 s | 365 ms | 0.005 | 88 / 95 / 100 / 100 |
| Testimonials | 65 | 95 | 100 | 100 | 4.78 s | 200 ms | 0.012 | 78 / 95 / 100 / 100 (CLS 0.214) |
| Contact | 46 | 95 | 100 | 100 | 5.21 s | 1,191 ms | 0.008 | 89 / 95 / 100 / 100 |

### Final round (after QA fixes) — same machine, Lighthouse 12.8 defaults

| Page | Perf | A11y | BP | SEO | LCP | TBT | CLS | Desktop Perf / A11y / BP / SEO |
|---|---|---|---|---|---|---|---|---|
| Home | 77 | 100 | 100 | 100 | 3.02 s | 413 ms | 0.000 | 97 / 100 / 100 / 100 (CLS 0.001) |
| About | 57 | 100 | 100 | 100 | 3.36 s | 2,135 ms | 0.000 | 97 / 100 / 100 / 100 |
| Products | 63 | 100 | 100 | 100 | 3.40 s | 1,020 ms | 0.000 | 93 / 100 / 100 / 100 |
| Testimonials | 75 | 100 | 100 | 100 | 2.52 s | 735 ms | 0.000 | 97 / 100 / 100 / 100 |
| Contact | 90 | 100 | 100 | 100 | 2.91 s | 184 ms | 0.000 | 100 / 100 / 100 / 100 |

- **Benchmark index:** these runs had a benchmark index of 615–1030, below a normal machine because other processes loaded it. The spread matters: About scored 57 at benchmark 615, while Contact scored 90 at 1030. Mobile TBT is mostly this simulated CPU cost.
- **Loading metrics are fixed:**
  - CLS is 0 everywhere.
  - Observed LCP equals FCP on every page, at both 4× CPU and desktop.
  - The main bundle dropped 58.8 → 41.7 KB gzip.
  - Critical fonts dropped 220 → 130 KB.
  - The main thread is idle before the first interaction.
- **Next step:** re-check with PageSpeed Insights on the deployed URL.

### Test suites (final)

| Suite | Result |
|---|---|
| Real-user run in Chrome (desktop 1440 + mobile 390): all pages, nav, intro, scroll scenes, filters, search, drawer, quote form, review form, contact form, FAQ, back-to-top, reload, browser Back | 37 / 37 |
| End-to-end vs Firebase emulators (admin login, CRUD, enquiries, reviews moderation, CSV, public pages, overflow at 3 sizes) | 79 / 79 |
| Mobile end-to-end (menu, action bar, modal, drawer, swipe, admin on phone) | 33 / 33 |
| Firestore security rules | 35 / 35 |
| Intro and scroll-scene behaviour (desktop + mobile) | 17 / 17 |
| Console errors / failed requests | 0 |

<!-- LH_ROUNDS -->

---

## Issue log

| ID | Page | Viewport | Category | Severity | What was seen | Why it hurts | Fix | Status |
|---|---|---|---|---|---|---|---|---|
| QA-001 | All | Mobile | Performance | High | Google Fonts CSS and font files were render-blocking, costing 1.7–2 s on mobile | Late first paint; visitors wait on a blank screen | Self-hosted, Latin-subset WOFF2 files (`public/fonts`) with `font-display: swap`; Google Fonts removed | Verified |
| QA-002 | Testimonials (and all pages) | Desktop | CLS | High | Text reflowed when the web fonts replaced the fallback (desktop CLS 0.214) | Content jumps under the reader's eyes | Metric-matched fallback faces (`Fraunces Fallback`, `Archivo Fallback`) using size-adjust and ascent/descent overrides | Verified |
| QA-003 | Home | Mobile | Performance | Critical | Score 27, TBT 4.1 s. The GSAP intro timeline, per-element reveal tweens and every scroll scene were built during load | The page is unresponsive for seconds on phones | Intro rebuilt as pure CSS (compositor-only). Reveals use one IntersectionObserver with CSS transitions. Scroll scenes are set up on first interaction or after idle. The Firestore SDK is lazy-loaded as its own chunk | Verified |
| QA-004 | Products | Mobile | Performance | High | The ambient background video became the LCP element and loaded during first paint | Slow LCP; mobile data wasted | Background films start only after the first interaction, and never with Save-Data or on 2G | Verified |
| QA-005 | All | Mobile | Performance | Medium | Hero images were single large files, discovered late | Slow LCP; oversized downloads on phones | Responsive `srcset` (640–1920 w), `fetchpriority=high`, and a per-page `<link rel=preload imagesrcset>` | Verified |
| QA-006 | Home | Desktop | CLS | High | CLS 0.278: the hero title was split into lines by JS after first paint | Visible jump on arrival | Title lines pre-split in the HTML | Verified |
| QA-007 | All | Mobile | Performance | High | Chrome laid out the whole unstyled page (~160 ms unthrottled) while the CSS file was still downloading, and the CSS was render-blocking | Slower first paint | Site CSS inlined into each page at build time (`inlineCss` in `vite.config.js`); admin keeps its own stylesheet | Verified |
| QA-008 | Home | Mobile | Performance (LCP) | High | The LCP element (hero subtitle) was hidden until the 2.7 s intro ended. Chrome also only counts an animated element once its entrance tween finishes | LCP 3.4–4.2 s | Hero content is painted under the intro from the first frame. Animated start states are painted by CSS, so nothing flashes. The subtitle itself is no longer animated | Verified (LCP = FCP) |
| QA-009 | About, Products, Testimonials, Contact | Mobile | Performance (LCP) | High | The hero `<img>` zoom tween (2.2 s) pushed LCP back to the end of the animation | LCP 2.7–3.5 s | Zoom moved to the wrapper (`.ph-media`) with a CSS start state; the image is static | Verified (LCP = FCP) |
| QA-010 | Home, About | Mobile | CLS | High | Bottom-anchored heroes were painted while the HTML was only half parsed, then grew (CLS 0.59 / 0.17 at 4× CPU) | Big jump on first load | `<link rel="expect" href="#after-hero" blocking="render">` holds first paint until the hero is fully parsed | Verified (CLS 0) |
| QA-011 | Products | Mobile | CLS | Medium | Filter chips and the catalogue were rendered by JS after first paint (CLS 0.18) | The list jumps down | Products page script is `blocking="render"`, so first paint already includes the catalogue | Verified (CLS 0) |
| QA-012 | Products | Mobile | CLS | Low | The two hero buttons re-wrapped after the font swap (CLS 0.019) | Small jump | Hero button rows stack full-width on screens ≤ 640 px (`.btn-row`), so the height is the same in either font | Verified |
| QA-013 | Home and others | Desktop | CLS | Medium | `ch`-based max-widths differ between the web font and its fallback (`ch` 0.58 em vs 0.47 em), re-wrapping the hero title (CLS 0.16) | Jump while fonts load | All `ch` widths converted to font-independent `em` values | Verified |
| QA-014 | Testimonials | Mobile | CLS / UX | Medium | A JS-inserted skeleton was replaced by the shorter empty state (CLS 0.055). Before that, "Reviews are on their way" flashed before Firestore answered | Jump; misleading empty state | Static loading placeholder in the HTML, with the same box as the empty state; real content replaces it | Verified (CLS 0) |
| QA-015 | All | All | Performance | Medium | ScrollTrigger refreshed on DOMContentLoaded and load, and on every `content-visibility` change, even with no triggers — each was a forced full-page layout | Long tasks during load | `autoRefreshEvents` limited to visibility change and resize; refresh only runs when triggers exist | Verified |
| QA-016 | All | Mobile | Performance | Medium | The closed mobile menu, enquiry modal and product drawer were laid out on every page load | Wasted layout work | `content-visibility: hidden` while closed (kept rendered until the close animation ends) | Verified |
| QA-017 | All | All | Performance | Medium | Long pages laid out and painted every below-the-fold section up front | Slow first render | `content-visibility: auto` with intrinsic sizes on below-the-fold sections and the footer; ScrollTrigger re-measures when they render | Verified |
| QA-018 | All | All | Performance | Low | Full-page `mix-blend-mode` grain and several `backdrop-filter` blurs made painting expensive | Janky scrolling on low-end phones | Grain kept as plain low-opacity texture; blurs on the header, chips and badges replaced by solid tints | Verified |
| QA-019 | All | All | Accessibility | Medium | Contrast failures: gold accent text on ivory, eyebrows, dimmed statement words, WhatsApp green | Hard to read; fails WCAG AA | New tokens: `--gold-700 #7d5a1d` for small text, `--gold-550 #9c7128` for large accents, `--wa #16804a`, `--dim #80857a` | Verified |
| QA-020 | All | All | Accessibility | Medium | Heading order skipped levels (footer `h4`, drawer `h4`) | Screen-reader navigation breaks | Footer headings are `h2.footer-title`; drawer sections are `h3` | Verified |
| QA-021 | All | All | Accessibility | Medium | The closed mobile menu, modal and drawer were still reachable by keyboard | Focus disappears into hidden UI | `inert` set while closed, plus a focus trap while open | Verified |
| QA-022 | All | Mobile | Accessibility | Low | Tap targets under 44 px: header phone ring, social icons, star rating labels | Mis-taps | Enlarged to 44 px | Verified |
| QA-023 | Home | All | UX | Medium | The opening intro replayed on every Home load and reload | Repeat visitors are forced to wait | Plays once per browser session. Skippable by click, key, wheel or touch; skipped on internal navigation and for reduced motion | Verified |
| QA-024 | All | Mobile | UX | Low | The menu, modal and drawer vanished instantly on close, cutting off their close animation | Abrupt; the transition was never seen | Visibility now switches at the end of the close transition | Verified |
| QA-025 | Testimonials | All | UX | Low | The rating summary sat in the page hero, showing a rating with zero reviews | Misleading social proof | Summary appears above the review list, only when approved reviews exist | Verified |
| QA-026 | Home | All | Performance / UX | Medium | The hero film started downloading during first paint | Competes with LCP; mobile data | Poster image paints first; the film starts after the first interaction and fades in once playing | Verified |
| QA-027 | All | — | SEO | Medium | No `sitemap.xml`; `robots.txt` didn't reference one | Slower or partial indexing | Both generated at build from `SITE_URL`; `/admin/` disallowed and served with `X-Robots-Tag: noindex` | Verified |
| QA-028 | All | — | SEO | Medium | No canonical URL and no `og:url` | Duplicate-URL risk (`/about` vs `/about.html`); weaker link previews | `<link rel=canonical>` and `og:url` built from `SITE_URL` plus the clean path | Verified |
| QA-029 | All | — | SEO | Low | The `og:image` used `f_auto` (AVIF/WebP), which some link-preview bots can't read | Broken WhatsApp/Facebook previews | JPEG 1200×630 `og:image`, plus `og:image:alt` and `og:locale=en_IN` | Verified |
| QA-030 | All | — | Security / Performance | Low | No security headers; self-hosted fonts were not cached long-term | Weaker hardening; repeat font downloads | `vercel.json`: `nosniff`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, and one-year immutable cache for `/fonts` and `/assets` | Verified |

| QA-031 | All | All | Performance | High | ScrollTrigger runs a perpetual `requestAnimationFrame` loop from the moment it registers, and Lenis was driven from the GSAP ticker every frame. That made ~65 main-thread frames per second on an idle page (Lighthouse "Other" ≈ 10 s) | Main-thread contention during load; battery drain | ScrollTrigger is lazy-loaded at the first interaction (its own 18 KB chunk; main bundle 58.8 → 41.7 KB gzip). Lenis's loop sleeps after ~1 s idle and wakes on input. Idle frames before interaction: 0 | Verified |
| QA-032 | Home | Mobile | Performance | Medium | Building the below-the-fold sections (categories, featured products, spaces, thickness guide, testimonials) ran as one long task during load | Blocks input (TBT) | Built in short idle slices; scroll scenes wait for them (`page.ready`) | Verified |
| QA-033 | Home | All | UX / Performance | Medium | The opening intro held the content for ~2.8 s (gone at 3.8 s) | Visitors wait before seeing anything; poor Speed Index | Whole sequence tightened by 22% (reveal ~2.2 s, gone ~3.0 s), still skippable; JS safety timers adjusted | Verified |
| QA-034 | Products | All | Accessibility | Medium | The count inside the selected filter chip was 3.97:1 (11 px, #8da797 on #0b4a32) | Fails WCAG AA | Count opacity raised to 0.75 (≥ 4.5:1 on both chip states) | Verified |
| QA-035 | Contact | All | Accessibility | Low | Contact card headings (`h3`) came before any `h2` | Heading outline skips a level | Visually hidden `h2` "Ways to reach us" before the cards | Verified |
| QA-036 | About, Home | Mobile | Performance | Low | Story, kitchen, showroom and CTA background images had a single fixed width (e.g. 800 px shown at ~170 px) | ~70 KB wasted per page on phones | `srcset` + `sizes` on all static images | Verified |
| QA-037 | Home, Products, Testimonials | All | Performance | Low | The full-bleed CTA veneer texture always downloaded at 1920 px | Wasted bytes on phones | `srcset` 640/1280/1920 with `sizes=100vw` | Verified |
| QA-038 | All | Mobile | Performance | Medium | Three variable fonts (220 KB) arrived separately, each triggering a full-page relayout after first paint. Each file carried ~250 glyphs and the full weight/width ranges | Long tasks (TBT); slower font arrival on 4G | Fonts split into a `latin-core` file (only the characters the site uses) plus on-demand `latin-supp`/`latin-ext` (`unicode-range`). Axes trimmed to the weights/widths in use. Critical fonts 220 → 130 KB (−41%) | Verified |
| QA-039 | Home | All | Visual | Critical | Hero title "Quality materials. Beautiful spaces." stayed invisible: the CSS start state was folded into GSAP's pixel `y` and never reset (regression from QA-008) | Brand headline missing | Hero tweens reset `y` explicitly | Verified |
| QA-040 | All (dev server) | All | UX | High | On reload the page painted unstyled for a moment: giant logo, then the mobile menu and quote form flashing | Looks broken while developing or reviewing | Site CSS is a real `<link rel=stylesheet>` (render-blocking in dev, inlined at build) instead of being injected by JS | Verified (reload filmstrip) |
| QA-041 | All | All | UX | Medium | No back-to-top control on long pages (requested by client) | Tedious on mobile | Back-to-top button after ~1 screen of scrolling, above the WhatsApp button and above the phone action bar; smooth scroll; focus returns to the logo | Verified |
| QA-042 | Products | All | UX | Medium | With a category chip selected, searching "flexi" said "No products match" | Visitors can't find products that exist | A search covers the whole range (filter switches to All) | Verified |
| QA-043 | Home | Desktop | CLS | High | CLS 0.178: locking scroll for the intro removed the scrollbar, widening the viewport ~15 px and moving the centred intro layers | Page jumps on arrival | `scrollbar-gutter: stable` on `html` (also stops the jump when the modal or drawer opens) | Verified (CLS 0.001, desktop Perf 97) |

<!-- MORE_ISSUES -->

---

## Needs client input

These items need a business decision or confirmation. The site works without them, but they should be settled before launch.

1. **Map location.** The provided Google Maps embed resolves to "Rajendra Glass & Plywoods", not to a Liveteck listing. Confirm that this is the correct shop location, or send the Google Maps link for Liveteck Ply & Boards.
2. **Product claims.** Confirm these product claims before they go live: "100% Gurjan", IS 303 / IS 710 / IS 5509 references, BWP/BWR grades and similar.
   - The 19 mm plywood CML number appears as both **6600090214** and **600090214** in the supplied material. Which is correct?
3. **Missing business details.** Business email, opening hours, GSTIN, social media links (Instagram, Facebook, YouTube), and the Google review link. The Testimonials page has a "Review us on Google" button waiting for this link.
4. **Real testimonials.** No testimonials are shown, by design (no fake reviews). Approved reviews appear automatically. Please collect a few from real customers, or approve website submissions in the admin.
5. **Production domain.** Set `SITE_URL` in Vercel (for example `https://www.liveteck.in`) so the canonical URLs, `og:url`, `sitemap.xml` and `robots.txt` point to the real domain. The current default is `https://liveteck-website.vercel.app`.
6. **Brand spelling.** The material uses "Liveteck", "LiveTeck" and "Livetech". The site uses **Liveteck** everywhere. Please confirm.
7. **"Est. 2015 / Serving since 2015".** Please confirm the year.
8. **Optional Cloudinary clean-up.** Some unused images can be deleted:
   - early `laminates` and `flush-doors` renders (replaced by the `-v2` versions)
   - `extra/craft (1)`
   - a test upload of `liveteck-icon`
