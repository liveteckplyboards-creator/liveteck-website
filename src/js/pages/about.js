import { boot } from '../core/app.js';
import { gsap, reduced, scrollLine } from '../core/motion.js';
import { $, $$, cld, srcset } from '../core/utils.js';

/** Founder card: the photo set in the admin (Settings → Founder photo); the logo card when there is none. */
function renderFounder(s) {
  const card = $('[data-founder]');
  const im = $('[data-founder-photo]', card);
  const src = s.founderPhoto || '';
  card.classList.toggle('has-photo', !!src);
  im.hidden = !src;
  if (!src || im.dataset.src === src) return;
  im.dataset.src = src;
  im.sizes = '(max-width: 980px) 100vw, 40vw';
  im.srcset = srcset(src, [480, 800, 1200]).replace(/c_limit/g, 'ar_10:11,c_fill,g_face');
  im.src = cld(src, 'w_800,ar_10:11,c_fill,g_face');
}

/** Brand values: each card settles back (smaller, dimmer) as the next one slides over it. */
function stackCards() {
  const cards = $$('[data-vs-card]');
  if (reduced) return;
  cards.slice(0, -1).forEach((card, i) => {
    gsap.to(card, {
      scale: 0.92 + i * 0.012, '--shade': 0.28, ease: 'none',
      scrollTrigger: { trigger: cards[i + 1], start: 'top 75%', end: 'top 25%', scrub: 0.6 },
    });
  });
}

boot('about', {
  render(data) { renderFounder(data.settings); },
  intro() {
    if (reduced) return;
    gsap.fromTo('.page-hero .ph-media', { scale: 1.2 }, { scale: 1, duration: 2.2, ease: 'power3.out' });
    gsap.from('.crumbs', { opacity: 0, y: 20, duration: 1, ease: 'expo.out', delay: 0.2 });
  },
  motion() {
    scrollLine($('[data-timeline]'), { start: 'top 80%', end: 'bottom 55%' });
    stackCards();
  },
});
