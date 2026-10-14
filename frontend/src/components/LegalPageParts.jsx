import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/* Shared building blocks for text-heavy legal pages (Privacy Policy,
   Terms of Service, ...) — kept in one place so every legal page looks
   and behaves identically. */

/* ─── Scrollspy: tracks which section heading is currently in view ─── */
export function useScrollSpy(ids, offset = 140) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    const handler = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - offset <= 0) {
          current = id;
        }
      }
      setActiveId(current);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [ids, offset]);

  return activeId;
}

/* ─── Table of contents: sticky sidebar on desktop, dropdown on mobile ─── */
export function TableOfContents({ items, activeId }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = (id) =>
    `block text-sm py-1.5 border-l-2 pl-3 transition-colors ${
      activeId === id
        ? 'border-sky-400 text-sky-400 font-semibold'
        : 'border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
    }`;

  return (
    <>
      {/* Mobile: collapsible dropdown */}
      <div className="md:hidden mb-8">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-white/10 bg-slate-900/40 text-sm font-semibold text-white"
        >
          Table of Contents
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`w-4 h-4 text-slate-400 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {mobileOpen && (
          <nav className="mt-2 p-3 rounded-lg border border-white/5 bg-slate-900/30 flex flex-col gap-0.5">
            {items.map((item) => (
              <a key={item.id} href={`#${item.id}`} className={linkClass(item.id)} onClick={() => setMobileOpen(false)}>
                {item.title}
              </a>
            ))}
          </nav>
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <nav className="hidden md:block sticky top-24 self-start w-56 flex-shrink-0" aria-label="Table of contents">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">On this page</p>
        <div className="flex flex-col gap-0.5">
          {items.map((item) => (
            <a key={item.id} href={`#${item.id}`} className={linkClass(item.id)}>
              {item.title}
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}

/* ─── One policy section — heading + body content ─────────────────── */
export function PolicySection({ id, title, children }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="flex flex-col gap-3 text-sm text-slate-400 leading-[1.75]">
        {children}
      </div>
    </section>
  );
}

/* ─── Back to top button — appears after scrolling past a threshold ─── */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 500);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full border border-white/10 bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-sky-400 hover:border-sky-500/30 transition-colors shadow-lg"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
