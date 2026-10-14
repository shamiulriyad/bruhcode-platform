import React from 'react';
import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';

const REPO_URL = 'https://github.com/shamiulriyad/bruhcode-platform';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Contests', to: '/' },
      { label: 'Calendar', to: '/calendar' },
      { label: 'Practice rooms', to: '/rooms' },
      { label: 'Brain Gym', to: '/games' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'About', to: '/about' },
      { label: 'How it works', to: '/how-it-works' },
      { label: 'FAQ', to: '/how-it-works#faq' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', to: '/privacy-policy' },
      { label: 'Terms of service', to: '/terms-of-service' },
      { label: 'Source code', href: REPO_URL },
    ],
  },
];

const PLATFORMS = [
  { name: 'Codeforces', color: '#FF5A5F' },
  { name: 'LeetCode', color: '#FFA116' },
  { name: 'AtCoder', color: '#22D3A6' },
  { name: 'CodeChef', color: '#C8A97E' },
  { name: 'GeeksforGeeks', color: '#2FB574' },
];

const GITHUB_PATH =
  'M12 2C6.48 2 2 6.48 2 12.02c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.56 9.56 0 0 1 12 6.84c.85 0 1.71.11 2.5.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12.02C22 6.48 17.52 2 12 2Z';

export default function Footer() {
  const year = new Date().getFullYear();
  const toTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  return (
    <footer className="ft-root">
      <style>{STYLES}</style>
      <div className="ft-wrap">
        {/* Prompt-style tagline strip */}
        <div className="ft-prompt" aria-hidden="true">
          <span className="ft-prompt-sign">&gt;</span>
          <span>every contest, one calm place</span>
          <span className="ft-caret" />
        </div>

        <div className="ft-grid">
          {/* Brand */}
          <div className="ft-brand">
            <Link to="/" className="inline-flex items-center gap-3" aria-label="BRUHCODE home">
              <BrandMark size={32} />
              <span className="ft-wordmark">BRUH<span>CODE</span></span>
            </Link>
            <p className="ft-desc">
              Upcoming contests from five platforms in one timeline, practice rooms for your team, and Brain Gym to sharpen your instincts.
            </p>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="ft-github">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d={GITHUB_PATH} /></svg>
              View on GitHub
            </a>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="ft-col">
              <h2 className="ft-col-title">{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className="ft-link">{l.label}</Link>
                    ) : (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="ft-link">{l.label} <span aria-hidden="true">↗</span></a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Platforms */}
          <div className="ft-col">
            <h2 className="ft-col-title">Tracked platforms</h2>
            <ul>
              {PLATFORMS.map((p) => (
                <li key={p.name} className="ft-platform">
                  <span style={{ background: p.color, boxShadow: `0 0 10px ${p.color}66` }} />
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Oversized wordmark */}
        <div className="ft-giant" aria-hidden="true">BRUHCODE</div>

        <div className="ft-bottom">
          <p>© {year} BRUHCODE · Built by Shamiul Islam Riyad</p>
          <button type="button" onClick={toTop} className="ft-top">
            Back to top
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
          </button>
        </div>
      </div>
    </footer>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

.ft-root {
  position: relative; overflow: hidden; margin-top: auto;
  font-family: 'DM Sans', system-ui, sans-serif; color: #94a3b8;
  background:
    radial-gradient(900px 300px at 15% 100%, rgba(182,255,92,0.06), transparent 70%),
    radial-gradient(900px 300px at 85% 100%, rgba(125,211,252,0.07), transparent 70%),
    #05060a;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.ft-root::before {
  content: ''; position: absolute; top: -1px; left: 10%; right: 10%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(182,255,92,0.45), rgba(125,211,252,0.45), transparent);
}
.ft-wrap { width: min(100% - 32px, 1240px); margin-inline: auto; padding-top: 56px; }

.ft-prompt {
  display: inline-flex; align-items: center; gap: 10px; padding: 8px 14px; border-radius: 12px;
  font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #cbd5e1;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
}
.ft-prompt-sign { color: #b6ff5c; }
.ft-caret { width: 8px; height: 16px; background: #b6ff5c; animation: ft-blink 1.2s steps(1, end) infinite; }
@keyframes ft-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }

.ft-grid { margin-top: 40px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; }
@media (min-width: 900px) { .ft-grid { grid-template-columns: 1.6fr repeat(4, minmax(0, 1fr)); gap: 32px; } }
.ft-brand { grid-column: 1 / -1; max-width: 380px; }
@media (min-width: 900px) { .ft-brand { grid-column: auto; } }
.ft-wordmark { font-weight: 700; font-size: 20px; letter-spacing: 0.04em; color: #f5f5f0; }
.ft-wordmark span { color: #b6ff5c; }
.ft-desc { margin-top: 16px; font-size: 15px; line-height: 1.65; color: #8b97ab; }
.ft-github {
  margin-top: 20px; display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 12px;
  font-size: 14px; font-weight: 500; color: #e2e8f0; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03);
  transition: border-color .2s ease, background .2s ease;
}
.ft-github:hover { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.06); }

.ft-col-title { margin-bottom: 14px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; }
.ft-col ul { display: grid; gap: 10px; }
.ft-link { position: relative; font-size: 15px; color: #a3aec2; transition: color .2s ease; }
.ft-link::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -2px; height: 1px; background: #b6ff5c;
  transform: scaleX(0); transform-origin: left; transition: transform .25s ease;
}
.ft-link:hover { color: #f5f5f0; }
.ft-link:hover::after { transform: scaleX(1); }
.ft-platform { display: flex; align-items: center; gap: 10px; font-size: 15px; color: #a3aec2; }
.ft-platform span { width: 7px; height: 7px; border-radius: 99px; flex-shrink: 0; }

.ft-giant {
  margin-top: 56px; user-select: none; text-align: center; line-height: 0.8;
  font-weight: 700; letter-spacing: -0.04em; font-size: clamp(64px, 17vw, 240px);
  background: linear-gradient(180deg, rgba(245,245,240,0.10) 0%, rgba(245,245,240,0.02) 85%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

.ft-bottom {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
  padding: 18px 0 26px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 13px; color: #64748b;
}
.ft-top { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 10px; color: #94a3b8; transition: color .2s ease, background .2s ease; }
.ft-top:hover { color: #f5f5f0; background: rgba(255,255,255,0.05); }

@media (prefers-reduced-motion: reduce) {
  .ft-caret { animation: none; }
  .ft-link, .ft-link::after, .ft-github, .ft-top { transition: none; }
}
`;
