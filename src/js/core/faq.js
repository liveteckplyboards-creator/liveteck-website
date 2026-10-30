import { $$ } from './utils.js';
import { reduced } from './motion.js';

/**
 * FAQ accordions (.faq > details): answers open and close with a smooth height animation.
 * Desktop (a real mouse): hovering a question opens it, moving away closes it again; a click keeps it open.
 * Touch and keyboard: tap / Enter toggles. Reduced motion: no animation.
 */
const DUR = 420;
const EASE = 'cubic-bezier(.22,1,.36,1)';

function setOpen(d, open) {
  if (d._want === open) return;
  d._want = open;
  const a = d.querySelector('.faq-a');
  const from = d._anim ? a.getBoundingClientRect().height : (open ? 0 : a.scrollHeight);
  d._anim?.cancel();
  d.open = true;
  d.classList.toggle('is-shut', !open);
  if (reduced || !a.animate) { d.open = open; d._anim = null; return; }
  a.style.overflow = 'hidden';
  const anim = a.animate([{ height: `${from}px`, opacity: open ? 0.2 : 1 }, { height: `${open ? a.scrollHeight : 0}px`, opacity: open ? 1 : 0 }], { duration: DUR, easing: EASE });
  d._anim = anim;
  anim.onfinish = () => { d._anim = null; a.style.overflow = ''; d.open = open; };
}

export function initFaq(root = document) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  $$('.faq', root).forEach(faq => {
    const items = $$('details', faq);
    const closeOthers = (keep) => items.forEach(o => { if (o !== keep && o._want && !o._pinned) setOpen(o, false); });
    items.forEach(d => {
      d._want = d.open;
      d.querySelector('summary').addEventListener('click', e => {
        e.preventDefault();
        if (d._want && d._hovered && !d._pinned) { d._pinned = true; return; } // opened by hover: a click keeps it open
        const open = !d._want;
        d._pinned = open;
        setOpen(d, open);
        if (open) closeOthers(d);
      });
      if (!fine) return;
      let t;
      d.addEventListener('mouseenter', () => {
        clearTimeout(t);
        t = setTimeout(() => { d._hovered = true; if (!d._want) { setOpen(d, true); closeOthers(d); } }, 120);
      });
      d.addEventListener('mouseleave', () => {
        clearTimeout(t);
        t = setTimeout(() => { d._hovered = false; if (!d._pinned) setOpen(d, false); }, 220);
      });
    });
  });
}
