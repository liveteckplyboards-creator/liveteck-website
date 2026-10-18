import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const root = __dirname;
// Live site origin for canonical/og:url, sitemap.xml and robots.txt — set SITE_URL in Vercel once the domain is final.
const SITE = (process.env.SITE_URL || 'https://liveteck-website.vercel.app').replace(/\/$/, '');

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
    transformIndexHtml: { order: 'pre', handler: html => render(html) },
    handleHotUpdate({ file, server }) {
      if (file.includes('partials')) server.ws.send({ type: 'full-reload' });
    },
  };
}

// sitemap.xml + robots.txt at build time.
function seoFiles() {
  const site = SITE;
  const pages = [['/', '1.0', 'weekly'], ['/products', '0.9', 'weekly'], ['/about', '0.7', 'monthly'], ['/testimonials', '0.6', 'weekly'], ['/contact', '0.8', 'monthly']];
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
        return html.replace(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g, (tag, file) => {
          const css = ctx.bundle[file];
          return css?.type === 'asset' ? `<style>${css.source}</style>` : tag;
        });
      },
    },
  };
}

export default defineConfig({
  plugins: [htmlIncludes(), seoFiles(), inlineCss()],
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        about: resolve(root, 'about.html'),
        products: resolve(root, 'products.html'),
        testimonials: resolve(root, 'testimonials.html'),
        contact: resolve(root, 'contact.html'),
        admin: resolve(root, 'admin/index.html'),
      },
    },
  },
  server: { port: 5173, host: true },
});
