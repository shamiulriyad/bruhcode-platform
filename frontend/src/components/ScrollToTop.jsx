import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/* React Router doesn't reset scroll position on navigation like a full
   page load would — without this, clicking a link while scrolled down
   (e.g. a footer link) lands on the new page still scrolled down. */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
