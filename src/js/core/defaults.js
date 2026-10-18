// Default catalogue & site settings.
// Used as an instant first render / offline fallback, and as the seed the
// admin dashboard can import into Firestore. Firestore data always wins.

const CLD = 'https://res.cloudinary.com/duswrz4u';
export const img = id => `${CLD}/image/upload/liveteck/${id}`;
export const vid = id => `${CLD}/video/upload/liveteck/${id}`;

export const MEDIA = {
  heroVideo: vid('video/hero'),
  heroPoster: img('brand/hero-poster'),
  showroom: img('brand/showroom'),
  craft: img('brand/craft'),
  texture: img('brand/veneer-texture'),
  kitchen: img('spaces/kitchen'),
  wardrobe: img('spaces/wardrobe'),
  living: img('spaces/living'),
  office: img('spaces/office'),
  doors: img('spaces/doors'),
  workshop: img('spaces/workshop'),
};

export const SETTINGS = {
  businessName: 'Liveteck Ply & Boards',
  tagline: 'Quality Materials. Beautiful Spaces.',
  phone: '+91 99121 53030',
  whatsapp: '919912153030',
  email: '',
  addressLine1: 'Temple Street, Beside Pydha Kalyana Mandapam',
  addressLine2: 'Kakinada, Andhra Pradesh, India',
  hours: '',
  gst: '',
  established: '2015',
  owner: 'Amith Jain',
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4590.818504980236!2d82.22744172501956!3d16.94942089580831!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3827e16952bc8b%3A0x94fa96a00b65fa35!2sRajendra%20Glass%20%26%20Plywoods!5e1!3m2!1sen!2sin!4v1792232725568!5m2!1sen!2sin',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=Temple+Street+Pydha+Kalyana+Mandapam+Kakinada',
  social: { facebook: '', instagram: '', youtube: '', google: '' },
  googleReviewUrl: '',
  heroTitle: 'Quality materials. <em>Beautiful spaces.</em>',
  heroSubtitle:
    'Plywood, block boards, flexi ply, veneers, laminates and flush doors — chosen for strength, finished for beauty. Serving Kakinada since 2015.',
  heroVideo: MEDIA.heroVideo,
  heroPoster: MEDIA.heroPoster,
  announcement: '',
};

export const CATEGORIES = [
  {
    id: 'plywood', name: 'Plywood', order: 1, image: img('products/plywood-19mm'),
    meta: '6 · 9 · 12 · 16 · 19 mm',
    short: 'Cross-laminated hardwood boards for every kind of furniture and interior work.',
    description: 'Layers of hardwood veneer bonded at right angles under heat and pressure — strong, stable and easy to work. From thin back panels to heavy-duty wardrobe carcasses, there is a thickness for every job.',
  },
  {
    id: 'block-board', name: 'Block Boards', order: 2, image: img('products/blockboard-19mm'),
    meta: '19 · 25 mm',
    short: 'Solid timber-strip core boards that stay stiff over long spans.',
    description: 'A core of solid wood strips sandwiched between veneers. Lighter than plywood of the same thickness and resistant to sagging — ideal for doors, long shelves, beds and table tops.',
  },
  {
    id: 'flexi-plywood', name: 'Flexi Plywood', order: 3, image: img('products/flexi-plywood'),
    meta: 'Bendable',
    short: 'Bendable plywood for curves, columns and rounded furniture.',
    description: 'Engineered to bend smoothly without cracking, flexi plywood brings curved walls, arches, columns and reception counters to life.',
  },
  {
    id: 'veneer', name: 'Veneers', order: 4, image: img('products/veneer'),
    meta: 'Natural wood',
    short: 'Real wood surfaces with natural, one-of-a-kind grain.',
    description: 'Thin slices of natural timber that give furniture, doors and wall panels the warmth and character of real wood — every sheet unique.',
  },
  {
    id: 'laminates', name: 'Laminates', order: 5, image: img('products/laminates-v2'),
    meta: 'Decorative surfaces',
    short: 'Durable decorative finishes in woodgrains, solids and textures.',
    description: 'Hard-wearing decorative surfaces that resist scratches, stains and daily wear — in a wide range of woodgrains, solid colours and textures.',
  },
  {
    id: 'flush-doors', name: 'Flush Doors', order: 6, image: img('products/flush-doors-v2'),
    meta: 'Ready to finish',
    short: 'Flat, clean-faced doors with a solid engineered core.',
    description: 'Smooth, flat doors with a sturdy core — ready to paint, polish, laminate or veneer to match any interior.',
  },
];

const P = (o) => ({ published: true, featured: false, images: [], specs: [], features: [], applications: [], badge: '', ...o });

export const PRODUCTS = [
  P({
    id: 'plywood-19mm', name: 'Plywood – 19 mm', category: 'plywood', thickness: '19 mm', order: 1, featured: true, badge: 'Heavy duty',
    images: [img('products/plywood-19mm'), img('products/plywood-19mm-b')],
    short: 'Our thickest, strongest plywood — the go-to board for wardrobes, kitchen carcasses, beds and heavy-load furniture.',
    description: '19 mm plywood is the backbone of serious furniture. Built from cross-laminated hardwood veneers pressed under heat and pressure, it holds screws firmly, resists warping and carries heavy loads without sagging — ideal wherever strength matters most.',
    features: ['100% Gurjan', 'BWP grade', 'Calibrated ply', 'Fire retardant', 'Termite proof', 'Borer proof', 'Selected timber', '4 times press'],
    specs: [
      { label: 'Thickness', value: '19 mm' },
      { label: 'Timber', value: '100% Gurjan' },
      { label: 'Grade', value: 'BWP · Type AA Grade 1' },
      { label: 'Standard', value: 'IS 5509' },
      { label: 'Treatment', value: 'Termite & borer proof' },
      { label: 'Process', value: 'Calibrated · 4 times press' },
    ],
    applications: ['Wardrobes', 'Kitchen carcasses', 'Beds', 'Heavy shelving', 'Partitions'],
  }),
  P({
    id: 'plywood-16mm', name: 'Plywood – 16 mm', category: 'plywood', thickness: '16 mm', order: 2, featured: true,
    images: [img('products/plywood-16mm')],
    short: 'A strong, versatile board for cabinet carcasses, shelves and modular furniture — a little lighter than 19 mm.',
    description: 'Balanced between strength and weight, 16 mm plywood is a favourite for modular furniture. It machines cleanly, takes laminates and veneers beautifully and keeps its shape over time.',
    features: ['Cross-laminated for stability', 'Firm screw holding', 'Smooth, even face', 'Takes laminate & veneer well'],
    specs: [{ label: 'Thickness', value: '16 mm' }],
    applications: ['Cabinet carcasses', 'Shelves', 'Study tables', 'TV units'],
  }),
  P({
    id: 'plywood-12mm', name: 'Plywood – 12 mm', category: 'plywood', thickness: '12 mm', order: 3, featured: true,
    images: [img('products/plywood-12mm')],
    short: 'Balanced strength and weight for partitions, cabinet sides, wall panelling and supported shutters.',
    description: 'A true all-rounder. 12 mm plywood is rigid enough for partitions and panelling yet light enough to handle easily on site — a dependable choice for interiors of every kind.',
    features: ['Versatile mid thickness', 'Easy to handle & cut', 'Stable cross-laminated build', 'Great base for panelling'],
    specs: [{ label: 'Thickness', value: '12 mm' }],
    applications: ['Partitions', 'Wall panelling', 'Cabinet sides', 'Supported shutters'],
  }),
  P({
    id: 'plywood-9mm', name: 'Plywood – 9 mm', category: 'plywood', thickness: '9 mm', order: 4,
    images: [img('products/plywood-9mm')],
    short: 'Light yet rigid — ideal for drawer sides, light shelving, back panels and panelling bases.',
    description: '9 mm plywood gives you stiffness without bulk. It is perfect for drawers, light-duty shelves and backing panels where you need a stable, flat board.',
    features: ['Light & rigid', 'Flat, stable sheets', 'Clean cutting', 'Good for drawers & backs'],
    specs: [{ label: 'Thickness', value: '9 mm' }],
    applications: ['Drawer sides', 'Light shelving', 'Back panels', 'Panelling base'],
  }),
  P({
    id: 'plywood-6mm', name: 'Plywood – 6 mm', category: 'plywood', thickness: '6 mm', order: 5,
    images: [img('products/plywood-6mm')],
    short: 'Thin and easy to work — for wardrobe and cabinet back panels, drawer bottoms and ceiling work.',
    description: 'Our thinnest plywood, made for jobs that need a flat, lightweight panel — backs of wardrobes and cabinets, drawer bottoms, ceilings and decorative work.',
    features: ['Lightweight', 'Easy to bend slightly & fix', 'Ideal for backs & bottoms', 'Smooth surface'],
    specs: [{ label: 'Thickness', value: '6 mm' }],
    applications: ['Back panels', 'Drawer bottoms', 'Ceilings', 'Decorative work'],
  }),
  P({
    id: 'blockboard-19mm', name: 'Block Board – 19 mm', category: 'block-board', thickness: '19 mm', order: 6, featured: true,
    images: [img('products/blockboard-19mm')],
    short: 'Solid timber-strip core between veneers — lighter than plywood and stiff over long spans.',
    description: 'Block board pairs a core of solid wood strips with veneer faces. At 19 mm it is a lighter alternative to plywood for doors, long shelves and furniture that needs to stay straight across wide spans.',
    features: ['Solid wood-strip core', 'Resists sagging', 'Lighter than plywood', 'Good for long spans'],
    specs: [{ label: 'Thickness', value: '19 mm' }, { label: 'Core', value: 'Solid timber strips' }],
    applications: ['Doors', 'Long shelves', 'Wardrobe shutters', 'Tables'],
  }),
  P({
    id: 'blockboard-25mm', name: 'Block Board – 25 mm', category: 'block-board', thickness: '25 mm', order: 7,
    images: [img('products/blockboard-25mm')],
    short: 'Extra-thick block board for table tops, beds, long-span shelves and large doors where rigidity is critical.',
    description: 'When a piece has to stay rock-solid across a wide span, 25 mm block board delivers. Its thick timber-strip core gives table tops, beds and large doors exceptional rigidity.',
    features: ['Extra thick 25 mm', 'Exceptional rigidity', 'Solid wood-strip core', 'For large, heavy pieces'],
    specs: [{ label: 'Thickness', value: '25 mm' }, { label: 'Core', value: 'Solid timber strips' }],
    applications: ['Table tops', 'Beds', 'Large doors', 'Long-span shelving'],
  }),
  P({
    id: 'flexi-plywood', name: 'Flexi Plywood', category: 'flexi-plywood', thickness: '', order: 8, featured: true, badge: 'Bendable',
    images: [img('products/flexi-plywood')],
    short: 'Bendable plywood that curves smoothly — for curved walls, columns, reception desks and rounded furniture.',
    description: 'Flexi plywood is engineered to bend into smooth curves without cracking, opening up design possibilities that flat boards can’t — from rounded counters to arches and column cladding.',
    features: ['Bends without cracking', 'Smooth curves', 'Easy to fix & finish', 'Opens up new designs'],
    specs: [{ label: 'Type', value: 'Flexible / bendable plywood' }],
    applications: ['Curved walls', 'Columns', 'Reception desks', 'Arches', 'Rounded furniture'],
  }),
  P({
    id: 'veneer', name: 'Veneer', category: 'veneer', thickness: '', order: 9, featured: true,
    images: [img('products/veneer')],
    short: 'Thin slices of natural wood for a genuine, one-of-a-kind timber finish on furniture, doors and walls.',
    description: 'Veneers bring the depth and warmth of real wood to any surface. Each leaf carries its own natural grain, so no two pieces are ever quite the same.',
    features: ['Real natural wood', 'Unique grain patterns', 'Premium, warm finish', 'Polish to any shade'],
    specs: [{ label: 'Type', value: 'Natural wood veneer' }],
    applications: ['Wall panelling', 'Furniture', 'Doors', 'Feature walls'],
  }),
  P({
    id: 'laminates', name: 'Laminates', category: 'laminates', thickness: '', order: 10, featured: true,
    images: [img('products/laminates-v2')],
    short: 'Durable decorative surfaces in woodgrains, solids and textures — scratch-resistant and easy to maintain.',
    description: 'Laminates give furniture a beautiful, hard-wearing finish. Choose from woodgrains, solid colours and textured surfaces that stand up to daily life and wipe clean easily.',
    features: ['Scratch & stain resistant', 'Easy to clean', 'Many designs & textures', 'Long-lasting finish'],
    specs: [{ label: 'Type', value: 'Decorative laminates' }],
    applications: ['Kitchens', 'Wardrobes', 'Office furniture', 'Tables'],
  }),
  P({
    id: 'flush-doors', name: 'Flush Doors', category: 'flush-doors', thickness: '', order: 11, featured: true,
    images: [img('products/flush-doors-v2')],
    short: 'Flat, clean-faced doors with a solid engineered core — ready to finish with paint, polish, veneer or laminate.',
    description: 'Flush doors offer a smooth, modern look and a sturdy core. Finish them your way — paint, polish, laminate or veneer — for homes, offices and commercial spaces.',
    features: ['Smooth flat faces', 'Sturdy core', 'Finish any way you like', 'Modern clean look'],
    specs: [{ label: 'Type', value: 'Flush door' }],
    applications: ['Bedroom doors', 'Main doors', 'Bathrooms', 'Offices'],
  }),
];

// General guidance, not product claims.
export const THICKNESS_GUIDE = [
  { id: '6', label: '6', unit: 'mm', title: '6 mm plywood', product: 'plywood-6mm', plies: 3, h: 34,
    text: 'Thin, light and easy to fix. Used where a flat panel is needed but the load is low.',
    uses: ['Wardrobe backs', 'Cabinet backs', 'Drawer bottoms', 'Ceiling work'] },
  { id: '9', label: '9', unit: 'mm', title: '9 mm plywood', product: 'plywood-9mm', plies: 5, h: 52,
    text: 'Stiffer than 6 mm while staying light — a good fit for drawers and light shelving.',
    uses: ['Drawer sides', 'Light shelves', 'Back panels', 'Panelling base'] },
  { id: '12', label: '12', unit: 'mm', title: '12 mm plywood', product: 'plywood-12mm', plies: 7, h: 70,
    text: 'The all-rounder — rigid enough for partitions and panelling, easy to handle on site.',
    uses: ['Partitions', 'Wall panelling', 'Cabinet sides', 'Supported shutters'] },
  { id: '16', label: '16', unit: 'mm', title: '16 mm plywood', product: 'plywood-16mm', plies: 9, h: 94,
    text: 'A strong board for modular furniture and carcasses where a little less weight helps.',
    uses: ['Cabinet carcasses', 'Shelves', 'Study tables', 'TV units'] },
  { id: '19', label: '19', unit: 'mm', title: '19 mm plywood', product: 'plywood-19mm', plies: 11, h: 112,
    text: 'Maximum strength for furniture that carries real weight and must last for years.',
    uses: ['Wardrobes', 'Kitchen carcasses', 'Beds', 'Heavy shelving'] },
  { id: '25', label: '25', unit: 'mm', title: '25 mm block board', product: 'blockboard-25mm', plies: 0, h: 148, blockboard: true,
    text: 'Solid timber-strip core for pieces that must stay straight across long spans.',
    uses: ['Table tops', 'Beds', 'Large doors', 'Long shelves'] },
];

export const SPACES = [
  { title: 'Modular kitchens', tag: 'Kitchen', image: MEDIA.kitchen, uses: 'BWP plywood carcasses, laminates & veneers' },
  { title: 'Wardrobes', tag: 'Bedroom', image: MEDIA.wardrobe, uses: '19 mm & 16 mm plywood, laminates' },
  { title: 'Living & TV walls', tag: 'Living', image: MEDIA.living, uses: 'Veneer panelling, 12 mm ply' },
  { title: 'Doors', tag: 'Entrances', image: MEDIA.doors, uses: 'Flush doors & block boards' },
  { title: 'Offices', tag: 'Commercial', image: MEDIA.office, uses: 'Flexi ply, laminates, block boards' },
  { title: 'Custom furniture', tag: 'Workshops', image: MEDIA.workshop, uses: 'The full Liveteck range' },
];
