// Writes the category landing pages (<slug>.html at the site root) from the copy below.
// Run after editing: node scripts/category-pages.mjs — then build. Products, key features and interiors
// are filled from live data by src/js/pages/category.js; everything here is the page's own copy.
// Real content only: every claim comes from the catalogue (src/js/core/defaults.js) or the client.
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORY_PAGES } from '../src/js/core/defaults.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WA = '919912153030';
const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const href = id => `/${CATEGORY_PAGES[id]}.html`;
const SHOP = 'We are on Temple Street, beside Pydha Kalyana Mandapam, Kakinada, Andhra Pradesh. Visit us to see and compare before you buy, or call / WhatsApp +91 99121 53030.';
const prices = what => `Prices depend on ${what}. Send us your list on WhatsApp (+91 99121 53030) and we will reply with prices and availability.`;

const PLYWOOD_CARD = { label: 'Plywood', title: 'Layered for all-round strength', text: 'Thin hardwood veneers glued at right angles. Strong in every direction, holds screws firmly and is the first choice for carcasses, kitchens and wardrobes.' };
const BLOCK_CARD = { label: 'Block board', title: 'Solid core for long spans', text: 'Solid timber strips between veneers. Lighter and very stiff along its length, so it suits doors, long shelves, beds and table tops that must not sag.' };
const VENEER_CARD = { label: 'Veneer', title: 'A real wood surface', text: 'Thin slices of natural timber. Every sheet is unique, and it can be polished to any shade for a warm, premium finish.' };
const LAMINATE_CARD = { label: 'Laminate', title: 'A hard-wearing decorative surface', text: 'Resists scratches, stains and daily wear, wipes clean easily, and comes in woodgrains, solid colours and textures.' };
const VENEER_OR_LAMINATE = 'Choose veneer for the genuine look and warmth of real wood, polished to the shade you want. Choose laminate for a hard-wearing, easy-clean surface on kitchens, wardrobes and office furniture.';

const PAGES = {
  plywood: {
    name: 'Plywood', title: 'BWP Plywood in Kakinada, 6 to 19 mm', image: 'products/plywood-19mm', video: 'video/layers-film',
    desc: 'BWP grade plywood in Kakinada with 100% Gurjan face veneer: calibrated, termite and borer proof, in 6, 9, 12, 16 and 19 mm. Lifetime warranty. Prices on WhatsApp.',
    h1: 'Plywood in<br><em>Kakinada</em>.', sizes: ['6', '9', '12', '16', '19'],
    lead: 'BWP grade plywood with a 100% Gurjan face veneer, in five thicknesses from 6 to 19 mm, with a lifetime warranty. See the sheets at our Temple Street store, or WhatsApp us for prices.',
    wa: 'plywood prices', waBtn: 'Plywood prices on WhatsApp',
    feat: ['In every sheet', 'One standard,<br><em>every</em> thickness.', 'From a 6 mm back panel to a 19 mm wardrobe carcass, every Liveteck plywood sheet is made the same way and carries the same lifetime warranty.'],
    prod: ['The range', 'Choose your<br><em>thickness</em>.', 'Tap a sheet for photos, specifications and where it is used. Prices depend on thickness and quantity, so send us your list and we will reply with today’s rates.'],
    guide: ['Quick guide', 'Which plywood<br>for <em>which</em> job?', 'General guidance for planning furniture. Every project is different, so our team will help you confirm the right mix.'],
    cols: ['Thickness', 'Best for', 'Why choose it'],
    rows: [
      ['19 mm', 'plywood-19mm', 'Wardrobes, kitchen carcasses, beds, heavy shelving', 'Maximum strength and screw holding for load-bearing furniture'],
      ['16 mm', 'plywood-16mm', 'Modular cabinets, shelves, study tables, TV units', 'Strong yet a little lighter than 19 mm'],
      ['12 mm', 'plywood-12mm', 'Partitions, wall panelling, cabinet sides', 'The versatile all-rounder'],
      ['9 mm', 'plywood-9mm', 'Drawer sides, light shelving, back panels', 'Light and rigid'],
      ['6 mm', 'plywood-6mm', 'Wardrobe & cabinet backs, drawer bottoms, ceilings', 'Thin, light and easy to fix'],
    ],
    spaces: ['The structure<br>behind the <em>room</em>.', 'Plywood forms the carcass of kitchens, wardrobes and custom furniture. Laminates and veneers finish the surface.'],
    vs: ['Plywood <em>or</em> block board?', { ...PLYWOOD_CARD, href: '#products', go: 'See the thicknesses' }, { ...BLOCK_CARD, href: href('block-board'), go: 'See block boards' }],
    faq: ['Buying plywood in Kakinada', 'Plywood<br><em>questions</em>.', [
      ['What is BWP plywood, and where should I use it?', 'BWP stands for Boiling Water Proof. The layers are bonded with a waterproof resin, so the board copes with moisture far better than ordinary plywood. Use it for kitchens, bathroom vanities, wash areas and anywhere near water. All Liveteck plywood is BWP grade.'],
      ['What does “100% Gurjan face veneer” mean?', 'Gurjan is a dense, strong hardwood. Our plywood is faced with 100% Gurjan veneer, which gives a smooth, even surface that takes laminate, veneer, polish or paint well.'],
      ['Which plywood thickness is best for kitchens and wardrobes?', 'Carcasses and shutters are usually made in 19 mm or 16 mm plywood. Back panels and drawer bottoms use 6 mm or 9 mm, and partitions or panelling 12 mm. Tell us your design and we will suggest the right mix.'],
      ['How do I get plywood prices?', prices('the thickness and the quantity')],
      ['Does your plywood come with a warranty?', 'Yes. Liveteck plywood comes with a lifetime warranty. Ask our team for the warranty details when you buy.'],
      ['Where is your plywood shop in Kakinada?', SHOP],
    ]],
    cta: 'Planning a<br><em>kitchen</em> or wardrobe?',
  },
  'block-board': {
    name: 'Block boards', title: 'Block Boards in Kakinada, 19 and 25 mm', image: 'products/blockboard-19mm', video: 'video/layers-film',
    desc: 'Block boards in Kakinada: solid wood-strip core, 100% Gurjan face veneer, 19 and 25 mm. Stays straight on doors, long shelves, beds and table tops. Lifetime warranty.',
    h1: 'Block boards in<br><em>Kakinada</em>.', sizes: ['19', '25'],
    lead: 'Solid timber-strip core boards with a 100% Gurjan face veneer, in 19 and 25 mm, with a lifetime warranty. They stay straight across long spans, which suits doors, long shelves, beds and table tops.',
    wa: 'block board prices', waBtn: 'Block board prices on WhatsApp',
    feat: ['In every board', 'Built to stay<br><em>straight</em>.', 'A core of solid wood strips between veneers makes a board that is lighter than plywood of the same thickness and resists sagging.'],
    prod: ['The range', 'Choose your<br><em>thickness</em>.', 'Tap a board for photos, specifications and where it is used. Prices depend on thickness and quantity, so send us your list and we will reply with today’s rates.'],
    guide: ['Quick guide', '19 mm <em>or</em><br>25 mm?', 'General guidance for planning furniture. Our team will help you confirm the right board for your design.'],
    cols: ['Thickness', 'Best for', 'Why choose it'],
    rows: [
      ['25 mm', 'blockboard-25mm', 'Table tops, beds, large doors, long-span shelving', 'Exceptional rigidity for large, heavy pieces'],
      ['19 mm', 'blockboard-19mm', 'Doors, long shelves, wardrobe shutters, tables', 'Lighter than plywood and good for long spans'],
    ],
    spaces: ['Where it stays<br><em>straight</em>.', 'Block boards go into doors, wardrobe shutters and custom furniture that spans a long width.'],
    vs: ['Plywood <em>or</em> block board?', { ...PLYWOOD_CARD, href: href('plywood'), go: 'See plywood' }, { ...BLOCK_CARD, href: '#products', go: 'See the thicknesses' }],
    faq: ['Buying block boards in Kakinada', 'Block board<br><em>questions</em>.', [
      ['What is a block board?', 'A block board has a core of solid timber strips between veneer faces. It is lighter than plywood of the same thickness and resists sagging, so it suits doors, long shelves, beds and table tops.'],
      ['Should I use block board or plywood?', 'Use block board where a piece spans a long width and must stay straight, such as doors, long shelves and table tops. Use plywood for carcasses, kitchens and wardrobes, where all-round strength and screw holding matter most. Tell us your design and we will suggest the right mix.'],
      ['Which thickness do I need, 19 mm or 25 mm?', '19 mm suits doors, long shelves, wardrobe shutters and tables. 25 mm is for table tops, beds, large doors and long-span shelving, where rigidity is critical.'],
      ['How do I get block board prices?', prices('the thickness and the quantity')],
      ['Do your block boards come with a warranty?', 'Yes. Liveteck block boards come with a lifetime warranty and a 100% Gurjan face veneer. Ask our team for the warranty details when you buy.'],
      ['Where is your shop in Kakinada?', SHOP],
    ]],
    cta: 'Planning<br><em>doors</em> or a bed?',
  },
  'flexi-plywood': {
    name: 'Flexi plywood', title: 'Flexi Plywood in Kakinada, Bendable Ply', image: 'products/flexi-plywood', video: 'video/layers-film',
    desc: 'Flexi plywood in Kakinada that bends smoothly without cracking, for curved walls, columns, reception desks, arches and rounded furniture. 100% Gurjan face veneer. Lifetime warranty.',
    h1: 'Flexi plywood in<br><em>Kakinada</em>.',
    lead: 'Bendable plywood with a 100% Gurjan face veneer and a lifetime warranty. It curves smoothly without cracking, for curved walls, columns, reception desks, arches and rounded furniture.',
    wa: 'flexi plywood prices', waBtn: 'Flexi ply prices on WhatsApp',
    feat: ['In every sheet', 'Made to<br><em>bend</em>.', 'Flexi plywood makes shapes that flat boards can’t, and it fixes and finishes like any other sheet.'],
    prod: ['The board', 'Curves without<br><em>cracks</em>.', 'Tap the sheet for photos and details. Tell us about your curve and how many sheets you need, and we will reply with prices and availability.'],
    guide: ['Ideas', 'Where flexi<br>plywood <em>works</em>.', 'Common uses for flexi plywood. Share your design and our team will help you plan it.'],
    cols: ['Use', 'What flexi plywood does'],
    rows: [
      ['Curved walls', '', 'Bends smoothly along the wall without cracking'],
      ['Columns', '', 'Wraps round columns as smooth cladding'],
      ['Reception desks', '', 'Gives counters a rounded front'],
      ['Arches', '', 'Forms smooth arches over openings'],
      ['Rounded furniture', '', 'Opens up curved designs that flat boards can’t make'],
    ],
    spaces: ['Curves in<br>real <em>rooms</em>.', 'Offices and living rooms use flexi plywood for rounded counters, columns and feature walls.'],
    vs: ['Flexi <em>or</em> regular plywood?',
      { label: 'Flexi plywood', title: 'Bends into curves', text: 'Engineered to bend smoothly without cracking. Use it for curved walls, columns, arches and rounded counters.', href: '#products', go: 'See flexi plywood' },
      { label: 'Plywood', title: 'Flat and strong', text: 'Cross-laminated layers for all-round strength and firm screw holding. The first choice for carcasses, kitchens and wardrobes.', href: href('plywood'), go: 'See plywood' }],
    faq: ['Buying flexi plywood in Kakinada', 'Flexi plywood<br><em>questions</em>.', [
      ['What is flexi plywood?', 'Flexi plywood is plywood engineered to bend into smooth curves without cracking. It is used for curved walls, columns, reception desks, arches and rounded furniture.'],
      ['Can I put laminate or veneer on flexi plywood?', 'Yes. Flexi plywood is easy to fix and finish. Ask our team which laminate or veneer suits your curve.'],
      ['Does your flexi plywood come with a warranty?', 'Yes. Liveteck flexi plywood comes with a lifetime warranty and a 100% Gurjan face veneer. Ask our team for the warranty details when you buy.'],
      ['How do I get flexi plywood prices?', prices('the quantity')],
      ['Where is your shop in Kakinada?', SHOP],
    ]],
    cta: 'Designing a<br><em>curve</em>?',
  },
  veneer: {
    name: 'Veneers', title: 'Wood Veneers in Kakinada, Natural Wood', image: 'products/veneer', video: 'video/veneer-film',
    desc: 'Natural wood veneers in Kakinada for furniture, doors, wall panelling and feature walls. Real timber grain, every sheet unique, polish to any shade. Lifetime warranty.',
    h1: 'Wood veneers in<br><em>Kakinada</em>.',
    lead: 'Thin slices of natural timber that give furniture, doors and walls the warmth of real wood, with a lifetime warranty. Every leaf has its own grain, so no two pieces are the same.',
    wa: 'veneer prices', waBtn: 'Veneer prices on WhatsApp',
    feat: ['In every leaf', 'Real wood,<br><em>real</em> grain.', 'A veneer is the genuine surface of the timber, sliced thin. Visit the store to choose the grain you want.'],
    prod: ['The range', 'The warmth of<br><em>real</em> wood.', 'Tap for photos and details. Grains and shades vary, so the best way to choose is in person at our Temple Street store, or ask us on WhatsApp.'],
    guide: ['Ideas', 'Where veneer<br><em>shines</em>.', 'Common uses for veneer. Share your design and our team will help you choose.'],
    cols: ['Use', 'Why veneer'],
    rows: [
      ['Wall panelling', '', 'Natural wood grain across a whole wall'],
      ['Feature walls', '', 'A one-of-a-kind focal point, since every leaf is unique'],
      ['Furniture', '', 'A warm, premium finish that can be polished to any shade'],
      ['Doors', '', 'The genuine look of real wood on the face of a door'],
    ],
    spaces: ['Rooms finished<br>in <em>wood</em>.', 'Living rooms, doors and offices use veneer where the surface should look and feel like real timber.'],
    vs: ['Veneer <em>or</em> laminate?', { ...VENEER_CARD, href: '#products', go: 'See veneers' }, { ...LAMINATE_CARD, href: href('laminates'), go: 'See laminates' }],
    faq: ['Buying veneers in Kakinada', 'Veneer<br><em>questions</em>.', [
      ['What is wood veneer?', 'Wood veneer is a thin slice of natural timber, fixed over a board such as plywood. It gives furniture, doors and wall panels the look of real wood, and every sheet has its own grain.'],
      ['Should I choose veneer or laminate?', VENEER_OR_LAMINATE],
      ['Can I see the veneers before I buy?', 'Yes. Grains and shades vary from sheet to sheet, so visit our Temple Street store to choose in person, or ask us on WhatsApp.'],
      ['Do your veneers come with a warranty?', 'Yes. Liveteck veneers come with a lifetime warranty. Ask our team for the warranty details when you buy.'],
      ['How do I get veneer prices?', prices('the veneer and the quantity')],
      ['Where is your shop in Kakinada?', SHOP],
    ]],
    cta: 'Want a real<br><em>wood</em> finish?',
  },
  laminates: {
    name: 'Laminates', title: 'Laminates in Kakinada, Decorative Sheets', image: 'products/laminates-v2',
    desc: 'Decorative laminates in Kakinada for kitchens, wardrobes, office furniture and tables: woodgrains, solid colours and textures that resist scratches and stains. Lifetime warranty.',
    h1: 'Laminates in<br><em>Kakinada</em>.',
    lead: 'Hard-wearing decorative surfaces in woodgrains, solid colours and textures, with a lifetime warranty. They resist scratches and stains and wipe clean, for kitchens, wardrobes and office furniture.',
    wa: 'laminate prices', waBtn: 'Laminate prices on WhatsApp',
    feat: ['In every sheet', 'Made for<br><em>daily</em> life.', 'Laminates give furniture a finish that stands up to cooking, cleaning and everyday use.'],
    prod: ['The range', 'Woodgrains, solids<br>and <em>textures</em>.', 'Tap for photos and details. Visit the store to see the designs in person, or ask us on WhatsApp.'],
    guide: ['Ideas', 'Where laminates<br><em>work</em> best.', 'Common uses for laminates. Share your design and our team will help you choose.'],
    cols: ['Use', 'Why laminate'],
    rows: [
      ['Kitchens', '', 'Resists stains and wipes clean'],
      ['Wardrobes', '', 'A long-lasting finish in the design you choose'],
      ['Office furniture', '', 'Stands up to daily wear'],
      ['Tables', '', 'A scratch-resistant surface for everyday use'],
    ],
    spaces: ['The surface<br>you <em>touch</em>.', 'In kitchens, wardrobes and offices, plywood builds the structure and laminate finishes the face.'],
    vs: ['Laminate <em>or</em> veneer?', { ...LAMINATE_CARD, href: '#products', go: 'See laminates' }, { ...VENEER_CARD, href: href('veneer'), go: 'See veneers' }],
    faq: ['Buying laminates in Kakinada', 'Laminate<br><em>questions</em>.', [
      ['What are laminates used for?', 'Laminates are decorative sheets fixed onto plywood or boards to give furniture a finished surface. They are used on kitchens, wardrobes, office furniture and tables.'],
      ['Should I choose laminate or veneer?', VENEER_OR_LAMINATE],
      ['Which board should go under laminate in a kitchen?', 'BWP plywood is the usual base for kitchen cabinets because it copes with moisture far better than ordinary plywood. All Liveteck plywood is BWP grade.'],
      ['Can I see the designs before I buy?', 'Yes. Visit our Temple Street store to see the woodgrains, solid colours and textures in person, or ask us on WhatsApp.'],
      ['Do your laminates come with a warranty?', 'Yes. Liveteck laminates come with a lifetime warranty. Ask our team for the warranty details when you buy.'],
      ['How do I get laminate prices?', prices('the design and the quantity')],
    ]],
    cta: 'Choosing a<br><em>finish</em>?',
  },
  'flush-doors': {
    name: 'Flush doors', title: 'Flush Doors in Kakinada, Ready to Finish', image: 'products/flush-doors-v2',
    desc: 'Flush doors in Kakinada with smooth, flat faces, a sturdy core and a 100% Gurjan face veneer, ready to paint, polish, laminate or veneer. For homes and offices. Lifetime warranty.',
    h1: 'Flush doors in<br><em>Kakinada</em>.',
    lead: 'Smooth, flat doors with a sturdy core and a 100% Gurjan face veneer, with a lifetime warranty. Finish them your way: paint, polish, laminate or veneer.',
    wa: 'flush door prices', waBtn: 'Door prices on WhatsApp',
    feat: ['In every door', 'Ready to<br><em>finish</em>.', 'A clean, modern door that takes the finish you choose, to match any interior.'],
    prod: ['The door', 'One door,<br>any <em>finish</em>.', 'Tap for photos and details. Send us how many doors you need and their sizes on WhatsApp, and we will reply with prices and availability.'],
    guide: ['Ideas', 'Where flush<br>doors <em>go</em>.', 'Common uses for flush doors. Ask our team which finish suits each room.'],
    cols: ['Use', 'Why a flush door'],
    rows: [
      ['Bedroom doors', '', 'Smooth faces for a clean, modern look'],
      ['Main doors', '', 'A sturdy core, finished to match your entrance'],
      ['Offices', '', 'Flat faces that take laminate or veneer to match the furniture'],
      ['Bathrooms', '', 'Ask our team which finish suits a wet area'],
    ],
    spaces: ['Doors that<br><em>match</em> the room.', 'Paint, polish, laminate or veneer: a flush door takes the same finish as the furniture around it.'],
    vs: ['Laminate <em>or</em> veneer face?', { ...LAMINATE_CARD, href: href('laminates'), go: 'See laminates' }, { ...VENEER_CARD, href: href('veneer'), go: 'See veneers' }],
    faq: ['Buying flush doors in Kakinada', 'Flush door<br><em>questions</em>.', [
      ['What is a flush door?', 'A flush door is a flat door with smooth faces over a sturdy engineered core. It has a clean, modern look and can be painted, polished, laminated or veneered.'],
      ['How can I finish a flush door?', 'Paint or polish it, or cover it with laminate or veneer to match your furniture. We stock laminates and veneers too, so you can choose the door and its finish in one visit.'],
      ['Do your flush doors come with a warranty?', 'Yes. Liveteck flush doors come with a lifetime warranty and a 100% Gurjan face veneer. Ask our team for the warranty details when you buy.'],
      ['How do I get flush door prices?', prices('the door size and the quantity')],
      ['Where is your shop in Kakinada?', SHOP],
    ]],
    cta: 'Fitting new<br><em>doors</em>?',
  },
};
const META = { plywood: '6 · 9 · 12 · 16 · 19 mm', 'block-board': '19 · 25 mm', 'flexi-plywood': 'Bendable', veneer: 'Natural wood', laminates: 'Decorative surfaces', 'flush-doors': 'Ready to finish' };

const card = c => `<a class="value-card reveal" href="${c.href}"><span class="vc-num">${c.label}</span><h3>${c.title}</h3><p>${c.text}</p><span class="card-go">${c.go} ${arrow}</span></a>`;
const cld = (w, id) => `https://res.cloudinary.com/duswrz4u/image/upload/f_auto,q_auto,w_${w},c_limit/liveteck/${id}`;

function page(id, p) {
  const slug = CATEGORY_PAGES[id];
  const waText = `Hi Liveteck Ply & Boards, please share ${p.wa}.`;
  const waHref = `https://wa.me/${WA}?text=${encodeURIComponent(waText)}`;
  const wa = (cls, label, extra = '') => `<a class="btn ${cls}" href="${waHref}" data-href="wa" data-wa-text="${e(waText)}" target="_blank" rel="noopener"${extra}>${label}</a>`;
  const head = (eyebrow, h2, lead, idAttr) => `
        <div class="section-head section-head--split">
          <div>
            <span class="eyebrow reveal">${eyebrow}</span>
            <h2 class="h2" id="${idAttr}" data-split style="margin-top:22px">${h2}</h2>
          </div>
          <p class="lead reveal">${lead}</p>
        </div>`;
  const faqs = p.faq[2];
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q.replace(/[“”]/g, ''), acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', '/'], ['Products', '/products'], [p.name, `/${slug}`]].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: `{{site}}${u}` })) };
  return `<!doctype html>
<!-- Generated by scripts/category-pages.mjs — edit the copy there, then run: node scripts/category-pages.mjs -->
<html lang="en-IN" class="no-js">
<head>
  <!-- @include head.html path="/${slug}" title="${e(p.title)} | Liveteck Ply &amp; Boards" desc="${e(p.desc)}" lcp="${p.image}" -->
  <script type="application/ld+json">${JSON.stringify(crumbs)}</script>
</head>
<body data-page="products" data-category="${id}">
  <!-- @include header.html -->

  <main id="main">
    <section class="page-hero grain">
      <div class="ph-media"${p.video ? ` data-bg-video="${p.video}"` : ''}><!-- @include hero-img.html id="${p.image}" --></div>
      <div class="container on-dark">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/products.html">Products</a><span aria-hidden="true">/</span><span>${p.name}</span></nav>
        <div class="ph-grid">
          <div>
            <h1 class="h1" data-split>${p.h1}</h1>${p.sizes ? `
            <ul class="ph-sizes reveal" aria-label="Thicknesses">${p.sizes.map((s, i) => `<li>${s}${i === p.sizes.length - 1 ? '<small>mm</small>' : ''}</li>`).join('')}</ul>` : ''}
          </div>
          <div class="reveal">
            <p class="lead">${p.lead}</p>
            <div class="btn-row" style="margin-top:28px">
              ${wa('btn--gold', p.waBtn)}
              <button class="btn btn--ghost" data-enquire>Request a quote</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- shared key features of the category (admin → Categories), rendered by category.js -->
    <section class="section bg-forest grain" id="after-hero" aria-labelledby="kf-title">
      <div class="container on-dark" style="position:relative;z-index:2">${head(...p.feat, 'kf-title')}
        <ul class="kf-list" data-cat-features></ul>
      </div>
    </section>

    <section class="section bg-ivory" id="products" aria-labelledby="pr-title">
      <div class="container">${head(...p.prod, 'pr-title')}
        <div class="product-grid product-grid--3" data-cat-products></div>
      </div>
    </section>

    <section class="section bg-ivory-2 cv" aria-labelledby="cmp-title">
      <div class="container">${head(...p.guide, 'cmp-title')}
        <div class="table-wrap reveal">
          <table class="compare">
            <thead><tr>${p.cols.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead>
            <tbody>
${p.rows.map(([label, prod, ...cells]) => `              <tr><th scope="row">${prod ? `<a class="cmp-link" href="#${prod}">${label}</a>` : label}</th>${cells.map(c => `<td>${e(c)}</td>`).join('')}</tr>`).join('\n')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section bg-ivory cv" aria-labelledby="spaces-title">
      <div class="container">${head('Where it’s used', ...p.spaces, 'spaces-title')}
        <div class="bento" data-cat-spaces></div>
      </div>
    </section>

    <section class="section bg-ivory-2 cv" aria-labelledby="vs-title">
      <div class="container">
        <div class="section-head section-head--center">
          <span class="eyebrow eyebrow--plain reveal">Know the difference</span>
          <h2 class="h2" id="vs-title" data-split>${p.vs[0]}</h2>
        </div>
        <div class="values-grid values-grid--2">
          ${card(p.vs[1])}
          ${card(p.vs[2])}
        </div>
      </div>
    </section>

    <!-- buyer questions (also published as FAQPage structured data below) -->
    <section class="section bg-ivory cv" id="faq" aria-labelledby="faq-title">
      <div class="container">
        <div class="contact-grid">
          <div>
            <span class="eyebrow reveal">${p.faq[0]}</span>
            <h2 class="h2" id="faq-title" data-split style="margin:22px 0 24px">${p.faq[1]}</h2>
            <p class="lead reveal">For homeowners, carpenters, interior designers, architects and builders. Still unsure? Call or WhatsApp us and we will help you choose.</p>
          </div>
          <div class="faq reveal">
${faqs.map(([q, a]) => `            <details><summary>${e(q)}<i></i></summary><div class="faq-a">${e(a)}</div></details>`).join('\n')}
          </div>
        </div>
      </div>
      <script type="application/ld+json">${JSON.stringify(ld)}</script>
    </section>

    <!-- the rest of the range: internal links to the other categories -->
    <section class="more-band bg-ivory-2 cv" aria-labelledby="more-title">
      <div class="container">
        <h2 class="eyebrow" id="more-title">More from Liveteck</h2>
        <nav class="more-cats" aria-labelledby="more-title">
${Object.keys(PAGES).filter(k => k !== id).map(k => `          <a href="${href(k)}"><b>${PAGES[k].name}</b><span>${META[k]}</span></a>`).join('\n')}
        </nav>
      </div>
    </section>

    <section class="section cta-banner grain cv" aria-labelledby="cta-title">
      <div class="cb-bg" data-bg-video="video/veneer-film"><img data-parallax="16" src="${cld(1920, 'brand/veneer-texture')}" srcset="${[640, 1280, 1920].map(w => `${cld(w, 'brand/veneer-texture')} ${w}w`).join(', ')}" sizes="100vw" alt="" loading="lazy" /></div>
      <div class="container on-dark">
        <div>
          <span class="eyebrow reveal">Prices &amp; availability</span>
          <h2 class="display" id="cta-title" data-split style="margin-top:22px">${p.cta}</h2>
        </div>
        <div class="actions reveal">
          <button class="btn btn--gold" data-enquire data-magnetic>Send enquiry</button>
          ${wa('btn--wa', 'WhatsApp', ' data-magnetic')}
        </div>
      </div>
    </section>
  </main>

  <!-- @include footer.html -->
  <script type="module" src="/src/js/pages/category.js"></script>
</body>
</html>
`;
}

for (const [id, p] of Object.entries(PAGES)) {
  writeFileSync(resolve(root, `${CATEGORY_PAGES[id]}.html`), page(id, p));
  console.log('wrote', `${CATEGORY_PAGES[id]}.html`);
}
