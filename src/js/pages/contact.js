import { boot } from '../core/app.js';
import { gsap, reduced } from '../core/motion.js';

boot('contact', {
  intro() {
    if (!reduced) gsap.from('.page-hero .ph-media img', { scale: 1.2, duration: 2.2, ease: 'power3.out' });
  },
});
