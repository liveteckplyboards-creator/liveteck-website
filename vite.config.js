import { defineConfig } from 'vite';
import { resolve, basename } from 'node:path';
import { readFileSync } from 'node:fs';
import { CATEGORY_PAGES as CATEGORY_SLUGS } from './src/js/core/defaults.js';

const root = __dirname;
// Live site origin for canonical/og:url, sitemap.xml and robots.txt — set SITE_URL in Vercel once the domain is final.
// The live domain is the default: a missing SITE_URL once pointed every canonical at the vercel.app copy,
// which kept www.liveteckply.com out of Google (Oct 2026).
const SITE = (process.env.SITE_URL || 'https://www.liveteckply.com').replace(/\/$/, '');

// Replaces <!-- @include file.html --> with the partial's contents (recursive),
// and {{key}} tokens from the include's attributes, e.g. <!-- @include page-hero.html title="About" -->
function htmlIncludes() {
  const render = (html, depth = 0) =>
    depth > 5 ? html : html.replace(/<!--\s*@include\s+([\w./-]+)([^>]*?)-->/g, (_, file, attrs) => {
      let part = readFileSync(resolve(root, 'partials', file), 'utf8');
      const vars = { site: SITE, ...Object.fromEntries([...attrs.matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1], m[2]])) };
      part = part.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : ''));
      return render(part, depth + 1);
    });
  return {
    name: 'html-includes',
    transformIndexHtml: { order: 'pre', handler: html => render(html).replace(/\{\{site\}\}/g, SITE) },
    handleHotUpdate({ file, server }) {
      if (file.includes('partials')) server.ws.send({ type: 'full-reload' });
    },
  };
}

// One search landing page per category: <slug>.html at the root, served as /<slug> (list in defaults.js).
const CATEGORY_PAGES = Object.entries(CATEGORY_SLUGS).map(([id, slug]) => ({ id, slug }));

// sitemap.xml + robots.txt at build time.
function seoFiles() {
  const site = SITE;
  const pages = [['/', '1.0', 'weekly'], ['/products', '0.9', 'weekly'], ...CATEGORY_PAGES.map(c => [`/${c.slug}`, '0.9', 'weekly']), ['/about', '0.7', 'monthly'], ['/testimonials', '0.6', 'weekly'], ['/contact', '0.8', 'monthly']];
  const today = new Date().toISOString().slice(0, 10);
  return {
    name: 'seo-files',
    apply: 'build',
    generateBundle() {
      const urls = pages.map(([p, pr, cf]) => `  <url><loc>${site}${p}</loc><lastmod>${today}</lastmod><changefreq>${cf}</changefreq><priority>${pr}</priority></url>`).join('\n');
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${site}/sitemap.xml\n` });
    },
  };
}

// Production links point straight at the clean URLs the hosts serve (/products, not /products.html → 308 redirect),
// in the pages and in the scripts that build links. Dev keeps the .html files Vite serves.
const CLEAN = new RegExp(`(["'\`(=])\/(about|products|contact|testimonials|${CATEGORY_PAGES.map(c => c.slug).join('|')})\.html`, 'g');
function cleanLinks() {
  return {
    name: 'clean-links',
    apply: 'build',
    transformIndexHtml: { order: 'post', handler: html => html.replace(CLEAN, '$1/$2') },
    renderChunk: code => (code.search(CLEAN) !== -1 ?{ code: code.replace(CLEAN, '$1/$2'), map: null } : null),
  };
}

// Products page: the catalogue is built in JS, so crawlers that don't run scripts (Bing, AI search) would see
// an empty page. Bake the default catalogue in as plain HTML (the script replaces it before first paint) and
// describe it as an ItemList for search engines.
function catalogueSeo() {
  const e = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return {
    name: 'catalogue-seo',
    apply: 'build',
    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('products.html')) return html;
      const { CATEGORIES, PRODUCTS } = await import('./src/js/core/defaults.js');
      const feats = (p) => {
        const c = CATEGORIES.find(x => x.id === p.category);
        return [...new Set([...(c?.features || []), ...(p.features || [])])];
      };
      const blocks = CATEGORIES.map(c => {
        const items = PRODUCTS.filter(p => p.category === c.id);
        return `<div class="cat-block" id="${e(c.id)}"><div class="cat-block-head"><h2>${e(c.name)}</h2><p>${e(c.description)}</p></div><div class="product-grid">${items.map(p => `
          <article class="product-card"><div class="pc-body"><h3>${e(p.name)}</h3><p class="pc-desc">${e(p.description || p.short)}</p>
          <ul class="pc-feats">${feats(p).map(f => `<li>${e(f)}</li>`).join('')}</ul>${p.applications?.length ? `<p>Ideal for: ${e(p.applications.join(', '))}</p>` : ''}</div></article>`).join('')}</div></div>`;
      }).join('');
      const list = {
        '@context': 'https://schema.org', '@type': 'ItemList', name: 'Liveteck Ply & Boards products, Kakinada',
        itemListElement: PRODUCTS.map((p, i) => ({
          '@type': 'ListItem', position: i + 1,
          item: { '@type': 'Product', name: p.name, description: p.short, image: p.images?.[0], url: `${SITE}/products#${p.id}`, category: CATEGORIES.find(c => c.id === p.category)?.name, brand: { '@type': 'Brand', name: 'Liveteck Ply & Boards' } },
        })),
      };
      return html
        .replace('<div class="container" data-catalogue aria-live="polite"></div>', `<div class="container" data-catalogue aria-live="polite">${blocks}</div>`)
        .replace('</head>', `<script type="application/ld+json">${JSON.stringify(list)}</script>\n</head>`);
    },
  };
}

// Category pages: same idea for their products and shared key features (category.js replaces it before first paint).
function categorySeo() {
  const e = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return {
    name: 'category-seo',
    apply: 'build',
    async transformIndexHtml(html, ctx) {
      const page = CATEGORY_PAGES.find(c => basename(ctx.filename) === `${c.slug}.html`); // exact: flexi-plywood-kakinada ends with plywood-kakinada
      if (!page) return html;
      const { CATEGORIES, PRODUCTS, landingFeatures } = await import('./src/js/core/defaults.js');
      const cat = CATEGORIES.find(c => c.id === page.id);
      const items = PRODUCTS.filter(p => p.category === page.id);
      const list = {
        '@context': 'https://schema.org', '@type': 'ItemList', name: `${cat.name}, Liveteck Ply & Boards, Kakinada`,
        itemListElement: items.map((p, i) => ({
          '@type': 'ListItem', position: i + 1,
          item: { '@type': 'Product', name: p.name, description: p.short, image: p.images?.[0], url: `${SITE}/${page.slug}#${p.id}`, category: cat.name, brand: { '@type': 'Brand', name: 'Liveteck Ply & Boards' } },
        })),
      };
      return html
        .replace('<ul class="kf-list" data-cat-features></ul>', `<ul class="kf-list" data-cat-features>${landingFeatures(cat, items).map(f => `<li>${e(f)}</li>`).join('')}</ul>`)
        .replace(/(<div class="product-grid[^"]*" data-cat-products>)(<\/div>)/, (_, open, close) => `${open}${items.map(p => `
          <article class="product-card"><div class="pc-body"><h3>${e(p.name)}</h3><p class="pc-desc">${e(p.description || p.short)}</p>${p.applications?.length ? `<p>Ideal for: ${e(p.applications.join(', '))}</p>` : ''}</div></article>`).join('')}${close}`)
        .replace('</head>', `<script type="application/ld+json">${JSON.stringify(list)}</script>
</head>`);
    },
  };
}

// Inline the shared site stylesheet (≈15 KB gzip) into the public pages: no render-blocking
// request, and no wasted layout of the unstyled page while the CSS file is still downloading.
function inlineCss() {
  return {
    name: 'inline-css',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle || ctx.filename.includes('admin')) return html;
        // Products builds its filters + catalogue in JS: hold first paint for that script so the
        // page doesn't paint empty and then jump (Chromium; other browsers ignore the attribute).
        if (ctx.filename.endsWith('products.html')) html = html.replace(/<script type="module" crossorigin src="(\/assets\/products-[^"]+\.js)"><\/script>/, '<script type="module" crossorigin blocking="render" src="$1"></script>');
        if (CATEGORY_PAGES.some(c => ctx.filename.endsWith(`${c.slug}.html`))) html = html.replace(/<script type="module" crossorigin src="(\/assets\/[\w-]+\.js)"><\/script>/, '<script type="module" crossorigin blocking="render" src="$1"></script>');
        return html.replace(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g, (tag, file) => {
          const css = ctx.bundle[file];
          return css?.type === 'asset' ? `<style>${css.source}</style>` : tag;
        });
      },
    },
  };
}

export default defineConfig({
  plugins: [htmlIncludes(), seoFiles(), catalogueSeo(), categorySeo(), cleanLinks(), inlineCss()],
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        about: resolve(root, 'about.html'),
        products: resolve(root, 'products.html'),
        testimonials: resolve(root, 'testimonials.html'),
        contact: resolve(root, 'contact.html'),
        ...Object.fromEntries(CATEGORY_PAGES.map(c => [c.slug, resolve(root, `${c.slug}.html`)])),
        admin: resolve(root, 'admin/index.html'),
      },
    },
  },
  server: { port: 5173, host: true },
});
