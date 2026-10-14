import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import Logo from './Logo';

/* ─── Static content config ───────────────────────────────────────
   Judge/platform pip colors reuse the same brand hexes used across
   Home.jsx / PracticeRooms.jsx — no new colors introduced. */
const JUDGES = [
  { label: 'Codeforces', to: '/platforms', pip: '#FF4D4D' },
  { label: 'AtCoder', to: '/platforms', pip: '#00C896' },
  { label: 'CodeChef', to: '/platforms', pip: '#A0855B' },
  { label: 'LeetCode', to: '/platforms', pip: '#FFA116' },
  { label: 'GeeksforGeeks', to: '/platforms', pip: '#0F9D58' },
];

const PLATFORM_LINKS = [
  { label: 'Contests', to: '/' },
  { label: 'Calendar', to: '/calendar' },
  { label: 'Virtual Practice Rooms', to: '/rooms' },
  { label: 'Brain Gym', to: '/games' },
  { label: 'Profile', to: '/profile' },
];

const RESOURCE_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Blog', href: '#' },
  { label: 'FAQ', to: '/how-it-works#faq' },
];

const COMMUNITY_LINKS = [
  { label: 'GitHub', href: 'https://github.com/riyad', external: true },
  { label: 'Contact', to: '/contact' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms of Service', to: '/terms-of-service' },
];

const PARTICLES = [
  { char: '{ }', left: '6%', duration: 19, delay: 0 },
  { char: '< >', left: '17%', duration: 23, delay: 3 },
  { char: ';', left: '29%', duration: 16, delay: 6 },
  { char: '( )', left: '41%', duration: 21, delay: 1.5 },
  { char: '#', left: '58%', duration: 18, delay: 8 },
  { char: '< >', left: '71%', duration: 25, delay: 4 },
  { char: '{ }', left: '83%', duration: 20, delay: 9.5 },
  { char: ';', left: '93%', duration: 17, delay: 2 },
];

/* ─── Social icon defs ─────────────────────────────────────────── */
const SOCIALS = [
  {
    name: 'GitHub',
    href: 'https://github.com/riyad',
    path: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.522 2 12 2z',
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
];

/* ─── Sub-component: brand block + newsletter CTA ─────────────────── */
function FooterBrand({ reduceMotion }) {
  return (
    <div className="fp-brand">
      <Link to="/" className="fp-logorow">
        <Logo size={40} />
        <div className="fp-logotype">
          <div className="fp-logotype-name">CodePulse</div>
          <div className="fp-logotype-sub">Contest Tracker</div>
        </div>
      </Link>

      <p className="fp-valueprop">Track every contest, sharpen every skill.</p>
      <p className="fp-tagline">
        Smart platform for competitive programming contest tracking. Stay ahead across every major platform — all in one place.
      </p>

      <div className="fp-pills">
        <div className="fp-pill fp-pill-status">
          <span className="fp-dot" />
          All systems operational
        </div>
        <div className="fp-pill fp-pill-version">v1.0.0</div>
      </div>

      <NewsletterForm reduceMotion={reduceMotion} />
    </div>
  );
}

/* ─── Sub-component: newsletter signup with animated submit states ── */
function NewsletterForm({ reduceMotion }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success

  const handleSubmit = (e) => {
    e.preventDefault();
    if (status === 'loading') return;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) {
      toast.error('Enter a valid email address');
      return;
    }
    setStatus('loading');
    // No newsletter endpoint exists yet — this simulates the request client-side.
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 2600);
    }, 900);
  };

  return (
    <form className="fp-newsletter" onSubmit={handleSubmit}>
      <div className="fp-newsletter-field">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="fp-newsletter-input"
          disabled={status !== 'idle'}
          aria-label="Email address for contest reminders"
        />
        <button type="submit" className="fp-newsletter-btn" disabled={status === 'loading'}>
          <AnimatePresence mode="wait" initial={false}>
            {status === 'idle' && (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.15 }}
              >
                Notify me
              </motion.span>
            )}
            {status === 'loading' && (
              <motion.span
                key="loading"
                className="fp-spinner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.15 }}
              />
            )}
            {status === 'success' && (
              <motion.svg
                key="success"
                className="fp-checkmark"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ scale: reduceMotion ? 1 : 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduceMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 320, damping: 16 }}
              >
                <path d="M5 13l4 4L19 7" />
              </motion.svg>
            )}
          </AnimatePresence>
        </button>
      </div>
      <p className="fp-newsletter-hint">Get a heads-up before contests start. No spam.</p>
    </form>
  );
}

/* ─── Sub-component: one collapsible link column ──────────────────── */
function FooterLinkColumn({ id, title, items, open, onToggle, itemVariants }) {
  return (
    <motion.div className="fp-col" variants={itemVariants}>
      <button
        type="button"
        className="fp-acc-header"
        aria-expanded={open}
        aria-controls={`fp-panel-${id}`}
        onClick={() => onToggle(id)}
      >
        <span className="fp-col-label">{title}</span>
        <svg
          className={`fp-acc-chevron${open ? ' is-open' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div id={`fp-panel-${id}`} className={`fp-acc-content${open ? ' is-open' : ''}`}>
        <div className="fp-acc-inner">
          <ul className="fp-links-list">
            {items.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link to={item.to} className="fp-link">
                    {item.pip && (
                      <span className="fp-link-pip" style={{ background: item.pip, boxShadow: `0 0 6px ${item.pip}77` }} />
                    )}
                    <span className="fp-link-underline">{item.label}</span>
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="fp-link"
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <span className="fp-link-underline">{item.label}</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Sub-component: social icon row with staggered entrance ──────── */
function FooterSocialRow({ reduceMotion }) {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.07 } },
  };
  const iconVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  return (
    <motion.div
      className="fp-socials"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={containerVariants}
    >
      {SOCIALS.map((s) => (
        <motion.a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="fp-social"
          aria-label={s.name}
          variants={iconVariants}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d={s.path} />
          </svg>
        </motion.a>
      ))}
    </motion.div>
  );
}

/* ─── Sub-component: bottom bar ────────────────────────────────────── */
function FooterBottomBar({ reduceMotion }) {
  const currentYear = new Date().getFullYear();
  return (
    <div className="fp-bottom">
      <p className="fp-copy">
        © <em>{currentYear}</em> CodePulse. All rights reserved.
      </p>
      <FooterSocialRow reduceMotion={reduceMotion} />
      <p className="fp-love">
        Built with <span className="fp-heart">♥</span> using React &amp; .NET
      </p>
    </div>
  );
}

/* ─── Main Footer ───────────────────────────────────────────────────── */
export default function Footer() {
  const shouldReduceMotion = useReducedMotion();
  const [openIds, setOpenIds] = useState(() => new Set(['platform']));

  const toggleColumn = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columnVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
  };

  const columns = [
    { id: 'platform', title: 'Platform', items: PLATFORM_LINKS },
    { id: 'judges', title: 'Supported Judges', items: JUDGES },
    { id: 'resources', title: 'Resources', items: RESOURCE_LINKS },
    { id: 'community', title: 'Community & Legal', items: COMMUNITY_LINKS },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

        .fp-root {
          font-family: 'Clash Display', sans-serif;
          background: #05050f;
          position: relative;
          overflow: hidden;
          margin-top: 48px;
        }

        .fp-root::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(110,231,247,0.28), rgba(139,92,246,0.22), transparent);
          z-index: 2;
        }

        .fp-noise {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0; opacity: 0.6;
        }

        .fp-grid-bg {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(110,231,247,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(110,231,247,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none; z-index: 0;
          mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.4) 80%, transparent);
          animation: fp-pan 50s linear infinite;
        }

        @keyframes fp-pan {
          from { background-position: 0 0, 0 0; }
          to { background-position: 60px 60px, 60px 60px; }
        }

        .fp-glow-1 {
          position: absolute; top: -100px; left: -60px;
          width: 600px; height: 400px;
          background: radial-gradient(ellipse, rgba(110,231,247,0.06) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }

        .fp-glow-2 {
          position: absolute; bottom: -80px; right: -40px;
          width: 500px; height: 300px;
          background: radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }

        .fp-glow-3 {
          position: absolute; top: 20%; left: 8%;
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(110,231,247,0.05) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        /* Drifting code-symbol particles — very low opacity, disabled under reduced motion */
        .fp-particles {
          position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
        }

        .fp-particle {
          position: absolute; bottom: -40px;
          font-family: 'JetBrains Mono', monospace;
          color: rgba(110,231,247,0.6);
          opacity: 0;
          animation-name: fp-drift;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes fp-drift {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.07; }
          90% { opacity: 0.07; }
          100% { transform: translateY(-420px) rotate(10deg); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .fp-particle { animation: none !important; opacity: 0 !important; }
          .fp-grid-bg { animation: none !important; }
          .fp-dot { animation: none !important; }
          .fp-heart { animation: none !important; }
        }

        .fp-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 88px 32px 0;
          position: relative;
          z-index: 1;
        }

        /* ─── TOP: BRAND + NEWSLETTER ─── */
        .fp-top {
          padding-bottom: 56px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 56px;
        }

        .fp-brand {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 480px;
        }

        .fp-logorow {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
        }

        .fp-logotype { display: flex; flex-direction: column; gap: 3px; }

        .fp-logotype-name {
          font-size: 20px; font-weight: 700;
          letter-spacing: -0.8px;
          background: linear-gradient(90deg, #f0f0f8 0%, rgba(240,240,248,0.7) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: all 0.3s;
        }

        .fp-logorow:hover .fp-logotype-name {
          background: linear-gradient(90deg, #38bdf8 0%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .fp-logotype-sub {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          color: rgba(240,240,248,0.25);
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .fp-valueprop {
          font-size: 16px; font-weight: 600; line-height: 1.5;
          color: rgba(240,240,248,0.82);
          letter-spacing: -0.2px;
        }

        .fp-tagline {
          font-size: 13.5px; line-height: 1.8;
          color: rgba(240,240,248,0.32);
          font-weight: 400; letter-spacing: 0.01em;
        }

        .fp-pills { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .fp-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 20px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.06em; cursor: default;
        }

        .fp-pill-status {
          background: rgba(110,231,247,0.05);
          border: 1px solid rgba(110,231,247,0.15);
          color: #6ee7f7;
        }

        .fp-pill-version {
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.18);
          color: rgba(167,139,250,0.8);
        }

        .fp-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #6ee7f7;
          box-shadow: 0 0 8px #6ee7f7;
          animation: fp-blink 2.4s ease infinite;
        }

        @keyframes fp-blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.8); }
        }

        /* ─── NEWSLETTER ─── */
        .fp-newsletter { margin-top: 6px; display: flex; flex-direction: column; gap: 8px; }

        .fp-newsletter-field {
          display: flex; align-items: stretch; gap: 10px;
          max-width: 380px;
        }

        .fp-newsletter-input {
          flex: 1; min-width: 0;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0 14px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          color: rgba(240,240,248,0.85);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .fp-newsletter-input::placeholder { color: rgba(240,240,248,0.22); }

        .fp-newsletter-input:focus {
          outline: none;
          border-color: rgba(110,231,247,0.4);
          box-shadow: 0 0 0 3px rgba(110,231,247,0.12), 0 0 20px rgba(110,231,247,0.08);
        }

        .fp-newsletter-input:disabled { opacity: 0.6; }

        .fp-newsletter-btn {
          flex-shrink: 0;
          min-width: 92px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #6ee7f7, #a78bfa);
          color: #05050f;
          font-weight: 700; font-size: 12.5px;
          border: none; border-radius: 10px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }

        .fp-newsletter-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(110,231,247,0.2);
        }

        .fp-newsletter-btn:disabled { cursor: default; }

        .fp-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(5,5,15,0.25);
          border-top-color: #05050f;
          border-radius: 50%;
          display: inline-block;
          animation: fp-spin 0.6s linear infinite;
        }

        @keyframes fp-spin { to { transform: rotate(360deg); } }

        .fp-checkmark { width: 16px; height: 16px; }

        .fp-newsletter-hint {
          font-size: 11px; color: rgba(240,240,248,0.2);
          letter-spacing: 0.02em;
        }

        /* ─── SOCIALS ─── */
        .fp-socials { display: flex; gap: 8px; }

        .fp-social {
          width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
          color: rgba(240,240,248,0.3);
          text-decoration: none;
          transition: transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s, border-color 0.3s, color 0.3s;
          position: relative; overflow: hidden;
        }

        .fp-social::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(110,231,247,0.08), rgba(139,92,246,0.08));
          opacity: 0; transition: opacity 0.3s;
        }

        .fp-social:hover {
          border-color: rgba(110,231,247,0.3);
          color: #6ee7f7;
          transform: perspective(400px) rotateX(10deg) rotateY(-10deg) scale(1.14) translateY(-3px);
          box-shadow: 0 10px 26px rgba(0,0,0,0.4), 0 0 0 1px rgba(110,231,247,0.1);
        }

        .fp-social:hover::before { opacity: 1; }
        .fp-social svg { width: 15px; height: 15px; position: relative; z-index: 1; }

        /* ─── COLUMNS ─── */
        .fp-grid-cols {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px 40px;
          margin-bottom: 48px;
        }

        @media (max-width: 900px) {
          .fp-grid-cols { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .fp-grid-cols { grid-template-columns: 1fr; gap: 0; }
        }

        .fp-col-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(240,240,248,0.4);
        }

        .fp-acc-header {
          width: 100%;
          display: flex; align-items: center; justify-content: space-between;
          background: none; border: none; padding: 0 0 20px;
          cursor: pointer;
          font: inherit;
        }

        .fp-acc-chevron {
          width: 14px; height: 14px;
          color: rgba(240,240,248,0.25);
          transition: transform 0.3s ease;
          display: none;
        }

        .fp-acc-chevron.is-open { transform: rotate(180deg); }

        .fp-acc-content {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.35s ease, opacity 0.3s ease;
        }

        .fp-acc-content.is-open { grid-template-rows: 1fr; opacity: 1; }
        .fp-acc-inner { overflow: hidden; min-height: 0; }

        @media (max-width: 640px) {
          .fp-acc-header { cursor: pointer; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .fp-acc-chevron { display: block; }
          .fp-acc-content:not(.is-open) { opacity: 0; }
        }

        /* Force columns permanently expanded above mobile breakpoint */
        @media (min-width: 641px) {
          .fp-acc-content { grid-template-rows: 1fr !important; opacity: 1 !important; }
          .fp-acc-header { pointer-events: none; }
        }

        .fp-links-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 2px;
        }

        .fp-link {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 0;
          font-size: 13.5px; font-weight: 500;
          color: rgba(240,240,248,0.5);
          text-decoration: none; letter-spacing: -0.1px;
          transition: color 0.25s;
        }

        .fp-link:hover { color: rgba(240,240,248,0.9); }

        .fp-link-pip { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .fp-link-underline { position: relative; }

        .fp-link-underline::after {
          content: '';
          position: absolute; left: 0; bottom: -3px; height: 1px; width: 0%;
          background: linear-gradient(90deg, #6ee7f7, #a78bfa);
          transition: width 0.2s ease;
        }

        .fp-link:hover .fp-link-underline::after { width: 100%; }

        /* ─── BOTTOM ─── */
        .fp-bottom {
          border-top: 1px solid rgba(255,255,255,0.04);
          padding: 20px 0 28px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
        }

        .fp-copy {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: rgba(240,240,248,0.17); letter-spacing: 0.04em;
        }

        .fp-copy em { font-style: normal; color: rgba(110,231,247,0.45); }

        .fp-love {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: rgba(240,240,248,0.17);
          display: flex; align-items: center; gap: 5px;
        }

        .fp-heart {
          color: #f7706e; display: inline-block;
          animation: fp-beat 1.8s ease infinite;
          filter: drop-shadow(0 0 4px rgba(247,112,110,0.5));
        }

        @keyframes fp-beat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(1.1); }
          75% { transform: scale(1.2); }
        }
      `}</style>

      <footer className="fp-root">
        <div className="fp-noise" />
        <div className="fp-grid-bg" />
        <div className="fp-glow-1" />
        <div className="fp-glow-2" />
        <div className="fp-glow-3" />
        <div className="fp-particles" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="fp-particle"
              style={{
                left: p.left,
                fontSize: 13 + (i % 3) * 2,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            >
              {p.char}
            </span>
          ))}
        </div>

        <div className="fp-inner">

          {/* ── TOP: BRAND + NEWSLETTER ── */}
          <motion.div
            className="fp-top"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <FooterBrand reduceMotion={shouldReduceMotion} />
          </motion.div>

          {/* ── LINK COLUMNS ── */}
          <motion.div
            className="fp-grid-cols"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={columnVariants}
          >
            {columns.map((col) => (
              <FooterLinkColumn
                key={col.id}
                id={col.id}
                title={col.title}
                items={col.items}
                open={openIds.has(col.id)}
                onToggle={toggleColumn}
                itemVariants={itemVariants}
              />
            ))}
          </motion.div>

          {/* ── BOTTOM BAR ── */}
          <FooterBottomBar reduceMotion={shouldReduceMotion} />

        </div>
      </footer>
    </>
  );
}
