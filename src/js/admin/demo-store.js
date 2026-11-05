// Local preview data for /admin/?demo (dev server only; never part of a production build).
// Lives in memory: a reload starts fresh. Every name and number here is a made-up sample.
import { SETTINGS, CATEGORIES, PRODUCTS, SPACES, MEDIA } from '../core/defaults.js';

const now = () => ({ seconds: Math.floor(Date.now() / 1000) });
const ago = (days, h = 0) => ({ seconds: Math.floor((Date.now() - days * 864e5 - h * 36e5) / 1000) });
const at = (days, hour = 11) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d.getTime(); };
let n = 0;
const uid = () => `demo${Date.now().toString(36)}${(n++).toString(36)}`;

const sampleLeads = [
  ['Sample Lead 1', '9000000001', 'Gandhi Nagar, Kakinada', 'plywood', 'meta-fb', 'new', 'Wants 19 mm BWP for a full kitchen. Asked for rate per sheet.', null, 0],
  ['Sample Lead 2', '9000000002', 'Sarpavaram, Kakinada', 'laminates', 'meta-ig', 'call-later', 'Busy at work, call after 6 PM.', at(0, 18), 1],
  ['Sample Lead 3', '9000000003', 'Ramanayyapeta', 'flush-doors', 'meta-fb', 'not-answered', '', at(-1, 11), 2],
  ['Sample Lead 4', '9000000004', 'Jagannaickpur', 'interior', 'meta-ig', 'contacted', 'Carpenter will visit the shop on Saturday.', at(3, 11), 3],
  ['Sample Lead 5', '9000000005', 'Samalkot', 'block-board', 'walk-in', 'quotation', 'Quote sent on WhatsApp for 40 sheets.', at(1, 12), 5],
  ['Sample Lead 6', '9000000006', 'Kakinada Port area', 'veneer', 'meta-fb', 'purchased', 'Bought 12 veneer sheets.', null, 9],
  ['Sample Lead 7', '9000000007', 'Peddapuram', 'plywood', 'meta-fb', 'not-interested', 'Price too high for them.', null, 12],
  ['Sample Lead 8', '9000000008', 'Rajahmundry', 'flexi-plywood', 'referral', 'not-required', 'Work starts in 3 months.', at(60, 11), 15],
  ['Sample Lead with a much longer name to test wrapping', '9000000009', 'Door 12-4-56, Main Road, near the temple, Kakinada Rural', 'interior', 'meta-ig', 'new', 'Full house interior: 3 bedrooms, kitchen and TV unit. Wants a showroom visit before deciding.', null, 0.2],
];

const DB = {
  settings: { site: { ...SETTINGS, migrations: [] } },
  categories: Object.fromEntries(CATEGORIES.map(({ id, ...c }) => [id, c])),
  products: Object.fromEntries(PRODUCTS.map(({ id, ...p }) => [id, p])),
  enquiries: {
    e1: { name: 'Sample Customer', phone: '9000000101', city: 'Kakinada', product: '19 mm BWP Plywood', message: 'Need 30 sheets for a kitchen, please share the price.', status: 'new', createdAt: ago(0, 2) },
    e2: { name: 'Sample Customer 2', phone: '9000000102', email: 'sample@example.com', city: 'Samalkot', product: 'Flush doors', message: 'Price for 6 doors?', status: 'contacted', createdAt: ago(2) },
  },
  testimonials: {
    t1: { name: 'Sample Reviewer', city: 'Kakinada', role: 'Homeowner', message: 'Sample review text used only in the local preview of the admin.', rating: 5, status: 'pending', createdAt: ago(1) },
  },
  media: Object.fromEntries(Object.entries(MEDIA).filter(([k]) => k !== 'heroVideo').map(([k, url], i) => [`m${i}`, { url, name: `${k}.jpg`, type: 'image', width: 1536, height: 1024, bytes: 420000, createdAt: ago(i) }])),
  gallery: Object.fromEntries(SPACES.map((s, i) => [`g${i}`, { url: s.image, caption: s.title, album: s.tag, published: true, order: (i + 1) * 10, createdAt: ago(i) }])),
  leads: Object.fromEntries(sampleLeads.map(([name, phone, address, requirement, source, status, notes, followUp, days], i) => [`l${i}`, {
    name, phone, phoneKey: phone, address, requirement, source, status, notes, followUp,
    history: [{ at: Date.now() - days * 864e5, status: 'new', note: 'Lead added' }, ...(status !== 'new' ? [{ at: Date.now() - days * 864e5 + 36e5, status, note: notes }] : [])],
    createdAt: ago(days),
  }])),
  crm: {},
};

// Firestore sentinels (serverTimestamp) become "now" here.
const clean = (data) => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v && typeof v === 'object' && !Array.isArray(v) && v.constructor !== Object ? now() : v]));
const col = (name) => (DB[name] ||= {});
const copy = (v) => structuredClone(v);

export const list = async (name) => Object.entries(col(name)).map(([id, d]) => ({ id, ...copy(d) }));
export const get = async (name, id) => (col(name)[id] ? { id, ...copy(col(name)[id]) } : null);
export const set = async (name, id, data, merge = true) => { col(name)[id] = { ...(merge ? col(name)[id] : {}), ...clean(data), updatedAt: now() }; };
export const update = async (name, id, data) => { if (!col(name)[id]) throw new Error('Not found'); Object.assign(col(name)[id], clean(data), { updatedAt: now() }); };
export const remove = async (name, id) => { delete col(name)[id]; };
export const add = async (name, data) => { const id = uid(); col(name)[id] = { ...clean(data), createdAt: now() }; return { id }; };
