import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const root = __dirname;

// Replaces <!-- @include file.html --> with the partial's contents (recursive),
// and {{key}} tokens from the include's attributes, e.g. <!-- @include page-hero.html title="About" -->
function htmlIncludes() {
  const render = (html, depth = 0) =>
    depth > 5 ? html : html.replace(/<!--\s*@include\s+([\w./-]+)([^>]*?)-->/g, (_, file, attrs) => {
      let part = readFileSync(resolve(root, 'partials', file), 'utf8');
      const vars = Object.fromEntries([...attrs.matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
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

export default defineConfig({
  plugins: [htmlIncludes()],
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
