import { boot } from '../core/app.js';
import { gsap, reduced, scrollLine } from '../core/motion.js';
import { $, $$ } from '../core/utils.js';

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
