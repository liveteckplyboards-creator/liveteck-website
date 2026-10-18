import { boot } from '../core/app.js';
import { gsap, reduced } from '../core/motion.js';

boot('contact', {
  intro() {
    if (!reduced) gsap.fromTo('.page-hero .ph-media', { scale: 1.2 }, { scale: 1, duration: 2.2, ease: 'power3.out' });
  },
});
