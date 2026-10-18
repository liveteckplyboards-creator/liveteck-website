# Liveteck Ply & Boards — website + admin

Five-page marketing site (Home, About, Products, Testimonials, Contact) with an admin dashboard at `/admin/`.

- **Stack:** Vite (multi-page), vanilla JS, GSAP ScrollTrigger + Lenis, Firebase (Firestore + Auth), Cloudinary (all images and videos).
- **Content:** every product, category, testimonial and business detail comes from Firestore and is managed in the admin. `src/js/core/defaults.js` is the built-in fallback and the seed for "Import default catalogue".

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173  (admin: /admin/)
npm run build      # outputs dist/
```

## Test locally against Firebase emulators

The emulators need Java 11 or newer and `firebase-tools`. They run with the real `firestore.rules`, so you can test without touching live data.

```bash
firebase emulators:start --only auth,firestore     # Auth :9099, Firestore :8080
VITE_EMULATORS=1 npm run dev -- --port 5174          # site + admin wired to the emulators
```

## Deploy (Vercel)

Import the repo in Vercel. `vercel.json` already sets the build command (`npm run build`), the `dist` output and clean URLs. After the first deploy, add the new domain under **Firebase console → Authentication → Settings → Authorized domains**, otherwise the admin login is blocked on that domain.

## Deploy (Firebase Hosting)

```bash
npm i -g firebase-tools
firebase login
npm run build
firebase deploy --only hosting,firestore:rules
```

`firestore.rules` locks the database. The public can read the catalogue and settings, read **approved** testimonials, and create enquiries and pending reviews. Only `liveteckplyboards@gmail.com` can change anything else. These rules were published to the live project on 18 Oct 2026. If you edit `firestore.rules`, publish it again.

## Admin dashboard

| Section | What it does |
|---|---|
| Overview | New enquiries, monthly count, live products, reviews to approve, and a checklist of missing business details |
| Enquiries | Every form submission. Change status (new → contacted → quoted → closed), add notes, call/WhatsApp in one tap, export CSV |
| Products | Add, edit, hide, feature and reorder products. Upload images to Cloudinary (the first image is the cover) |
| Categories | The six material categories shown on the home page and products page |
| Testimonials | Reviews submitted on the website arrive as *pending*. Approve them to publish, or add verified reviews yourself |
| Media library | Upload and reuse images and videos (Cloudinary) |
| Settings | Phone, WhatsApp, email, hours, address, GST, Google Maps embed, social links, home hero text, video and poster |

## Data model (Firestore)

- `settings/site` holds the business details and hero content
- `categories/{id}` has: name, meta, short, description, image, order
- `products/{id}` has: name, category, thickness, badge, short, description, features[], specs[{label,value}], applications[], images[], featured, published, order
- `testimonials/{id}` has: name, role, company, city, message, rating, photo, status (pending | approved | hidden), source
- `enquiries/{id}` has: name, phone, email, city, product, message, page, status, notes, createdAt
- `media/{id}` has: url, publicId, type, size, name

## Media (Cloudinary `duswrz4u`, preset `liveteck`)

`liveteck/products/*`, `liveteck/spaces/*`, `liveteck/brand/*`, `liveteck/video/*`. Delivery URLs get `f_auto,q_auto` plus a width, added automatically by `cld()` in `src/js/core/utils.js`.
