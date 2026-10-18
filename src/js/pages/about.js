import { boot } from '../core/app.js';
import { gsap, reduced } from '../core/motion.js';

boot('about', {
  intro() {
    if (reduced) return;
    gsap.fromTo('.page-hero .ph-media', { scale: 1.2 }, { scale: 1, duration: 2.2, ease: 'power3.out' });
    gsap.from('.crumbs', { opacity: 0, y: 20, duration: 1, ease: 'expo.out', delay: 0.2 });
  },
});
