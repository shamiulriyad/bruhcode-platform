import React, { startTransition, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { contestAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import BrandMark from './BrandMark';

const LINKS = [
  { label: 'Contests', path: '/', public: true },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Practice', path: '/rooms' },
  { label: 'Brain Gym', path: '/games' },
  { label: 'About', path: '/about', public: true },
];

const PLATFORM_COLORS = {
  Codeforces: '#FF5A5F',
  LeetCode: '#FFA116',
  AtCoder: '#22D3A6',
  CodeChef: '#C8A97E',
  GeeksforGeeks: '#2FB574',
};

const ICONS = {
  user: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4',
  brain: 'm8 9-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  chevron: 'm6 9 6 6 6-6',
};

function Glyph({ name, className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const initialsOf = (user) =>
  (user?.displayName || user?.username || user?.email || 'C')
    .split(/[\s._@-]+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

/* Next or currently-live contest, refreshed every 30 s. */
function useNextContest() {
  const [contests, setContests] = useState([]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    contestAPI.getAll().then(({ data }) => setContests(data)).catch(() => {});
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  let best = null;
  for (const c of contests) {
    const start = new Date(c.startTime).getTime();
    const end = start + (c.duration || 0) * 60_000;
    if (end <= now) continue;
    const live = start <= now;
    if (!best || (live && !best.live) || (live === best.live && start < best.start)) best = { ...c, start, live };
  }
  if (!best) return null;
  const mins = Math.max(0, Math.round((best.start - now) / 60_000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return { ...best, label: best.live ? 'Live now' : d > 0 ? `in ${d}d ${h}h` : h > 0 ? `in ${h}h ${m}m` : `in ${m}m` };
}

/* Close a popover on outside click or Escape. */
function useDismiss(open, setOpen, ref) {
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen, ref]);
}

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const next = useNextContest();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);
  useDismiss(menuOpen, setMenuOpen, menuRef);

  const links = LINKS.filter((l) => l.public || isAuthenticated);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Route changes run as transitions (v7_startTransition), so log out inside the same
  // transition — otherwise a protected page sees the logout first and bounces to /login.
  const signOut = () => startTransition(() => {
    navigate('/');
    logout();
  });

  const accountItems = [
    { label: 'Profile', to: '/profile', icon: 'user' },
    { label: 'Brain Gym stats', to: '/profile/brain-gym', icon: 'brain' },
    { label: 'Settings', to: '/profile/settings', icon: 'settings' },
  ];

  return (
    <header className={`nb-root${scrolled ? ' is-scrolled' : ''}`}>
      <style>{STYLES}</style>
      <div className="nb-bar">
        {/* Brand */}
        <Link to="/" className="nb-brand" aria-label="BRUHCODE home">
          <BrandMark size={26} blink />
          <span className="nb-wordmark">BRUH<span>CODE</span></span>
        </Link>

        {/* Desktop links with a sliding active pill */}
        <nav className="nb-links" aria-label="Main">
          {links.map((link) => (
            <NavLink key={link.path} to={link.path} end={link.path === '/'} className="nb-link">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nb-active"
                      className="nb-link-pill"
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="nb-right">
          {/* Live "next contest" ticker */}
          {next && (
            <Link to={`/contest/${next.id}`} className={next.live ? 'nb-ticker is-live' : 'nb-ticker'} title={next.name}>
              <span className="nb-ticker-dot" style={{ background: next.live ? '#f87171' : PLATFORM_COLORS[next.platform] || '#7dd3fc' }} />
              <span className="nb-ticker-label">{next.live ? 'Live' : 'Next'}</span>
              <span className="nb-ticker-platform">{next.platform}</span>
              <span className="nb-ticker-time">{next.label}</span>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="nb-avatar-btn"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="nb-avatar">
                  {user?.profilePictureUrl ? <img src={user.profilePictureUrl} alt="" /> : initialsOf(user)}
                </span>
                <Glyph name="chevron" className={menuOpen ? 'h-3.5 w-3.5 rotate-180 transition-transform' : 'h-3.5 w-3.5 transition-transform'} />
              </button>
              {menuOpen && (
                <div className="nb-menu" role="menu">
                  <div className="nb-menu-head">
                    <div className="nb-menu-name">{user?.displayName || 'Coder'}</div>
                    <div className="nb-menu-handle">@{user?.username || user?.email?.split('@')[0]}</div>
                  </div>
                  {accountItems.map((item) => (
                    <Link key={item.to} to={item.to} role="menuitem" className="nb-menu-item">
                      <Glyph name={item.icon} /> {item.label}
                    </Link>
                  ))}
                  <button type="button" role="menuitem" className="nb-menu-item is-danger" onClick={signOut}>
                    <Glyph name="logout" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nb-auth">
              <Link to="/login" className="nb-signin">Sign in</Link>
              <Link to="/register" className="nb-cta">Get started</Link>
            </div>
          )}

          <button
            type="button"
            className="nb-burger"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="nb-mobile"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Glyph name={mobileOpen ? 'close' : 'menu'} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div id="nb-mobile" className="nb-sheet">
          {next && (
            <Link to={`/contest/${next.id}`} className="nb-sheet-next">
              <span className="nb-ticker-dot" style={{ background: next.live ? '#f87171' : PLATFORM_COLORS[next.platform] || '#7dd3fc' }} />
              <span className="min-w-0 flex-1 truncate">{next.live ? 'Live now' : 'Next up'} · {next.name}</span>
              <span className="nb-ticker-time">{next.label}</span>
            </Link>
          )}
          <nav aria-label="Main" className="nb-sheet-links">
            {links.map((link) => (
              <NavLink key={link.path} to={link.path} end={link.path === '/'} className={({ isActive }) => (isActive ? 'nb-sheet-link is-active' : 'nb-sheet-link')}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          {isAuthenticated ? (
            <div className="nb-sheet-account">
              {accountItems.map((item) => (
                <Link key={item.to} to={item.to} className="nb-menu-item"><Glyph name={item.icon} /> {item.label}</Link>
              ))}
              <button type="button" className="nb-menu-item is-danger" onClick={signOut}><Glyph name="logout" /> Sign out</button>
            </div>
          ) : (
            <div className="nb-sheet-auth">
              <Link to="/login" className="nb-signin">Sign in</Link>
              <Link to="/register" className="nb-cta">Get started</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

.nb-root {
  position: sticky; top: 0; z-index: 50; padding: 12px 16px 0;
  font-family: 'DM Sans', system-ui, sans-serif;
  pointer-events: none;
}
.nb-bar {
  pointer-events: auto; position: relative;
  width: min(100%, 1240px); margin: 0 auto; height: 60px; padding: 0 10px 0 18px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  border-radius: 20px;
  background: rgba(10,12,18,0.55);
  border: 1px solid rgba(255,255,255,0.07);
  backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%);
  transition: background .3s ease, box-shadow .3s ease, border-color .3s ease;
}
.nb-bar::before {
  content: ''; position: absolute; inset: 0 40px auto; height: 1px; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(182,255,92,0.35), rgba(125,211,252,0.35), transparent);
}
.nb-root.is-scrolled .nb-bar {
  background: rgba(10,12,18,0.85);
  border-color: rgba(255,255,255,0.1);
  box-shadow: 0 20px 50px -24px rgba(0,0,0,0.9);
}

.nb-brand { display: inline-flex; align-items: center; gap: 10px; flex-shrink: 0; }
.nb-wordmark { font-weight: 700; font-size: 17px; letter-spacing: 0.04em; color: #f5f5f0; }
.nb-wordmark span { color: #b6ff5c; }

.nb-links { display: none; align-items: center; gap: 2px; }
.nb-link { position: relative; padding: 8px 14px; border-radius: 12px; font-size: 14px; font-weight: 500; color: #94a3b8; transition: color .2s ease; white-space: nowrap; }
.nb-link:hover { color: #f1f5f9; }
.nb-link.active { color: #f8fafc; }
.nb-link-pill { position: absolute; inset: 0; border-radius: 12px; background: rgba(255,255,255,0.07); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08); }

.nb-right { display: flex; align-items: center; gap: 10px; min-width: 0; }

.nb-ticker {
  display: none; align-items: center; gap: 8px; max-width: 320px; padding: 7px 12px; border-radius: 999px;
  font-size: 13px; color: #94a3b8; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  transition: border-color .2s ease, color .2s ease;
}
.nb-ticker:hover { color: #e2e8f0; border-color: rgba(255,255,255,0.16); }
.nb-ticker.is-live { border-color: rgba(248,113,113,0.35); }
.nb-ticker-dot { flex-shrink: 0; width: 7px; height: 7px; border-radius: 99px; }
.nb-ticker.is-live .nb-ticker-dot { animation: nb-pulse 1.8s ease-in-out infinite; }
@keyframes nb-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.6); } 50% { box-shadow: 0 0 0 5px rgba(248,113,113,0); } }
.nb-ticker-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; }
.nb-ticker-platform { color: #e2e8f0; font-weight: 500; white-space: nowrap; }
.nb-ticker-time { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #b6ff5c; white-space: nowrap; }
.nb-ticker.is-live .nb-ticker-time { color: #fca5a5; }

.nb-auth { display: none; align-items: center; gap: 6px; }
.nb-signin { padding: 8px 14px; border-radius: 12px; font-size: 14px; font-weight: 500; color: #cbd5e1; }
.nb-signin:hover { color: #f8fafc; background: rgba(255,255,255,0.05); }
.nb-cta {
  display: inline-flex; align-items: center; padding: 9px 16px; border-radius: 12px; font-size: 14px; font-weight: 600;
  color: #0b0d14; background: #f5f5f0; transition: background .2s ease, transform .2s ease;
}
.nb-cta:hover { background: #ffffff; transform: translateY(-1px); }

.nb-avatar-btn { display: flex; align-items: center; gap: 6px; padding: 4px 8px 4px 4px; border-radius: 999px; color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); transition: border-color .2s ease, color .2s ease; }
.nb-avatar-btn:hover, .nb-avatar-btn[aria-expanded="true"] { color: #f1f5f9; border-color: rgba(255,255,255,0.18); }
.nb-avatar { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 99px; overflow: hidden; font-size: 12px; font-weight: 700; color: #0b0d14; background: linear-gradient(135deg, #b6ff5c, #7dd3fc); }
.nb-avatar img { width: 100%; height: 100%; object-fit: cover; }

.nb-menu {
  position: absolute; right: 0; top: calc(100% + 10px); width: 240px; padding: 6px; border-radius: 16px;
  background: #0e1018; border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 30px 70px -20px rgba(0,0,0,0.9);
  animation: nb-in .16s ease-out;
}
@keyframes nb-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.nb-menu-head { padding: 10px 12px 12px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.07); }
.nb-menu-name { font-weight: 600; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nb-menu-handle { font-size: 13px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nb-menu-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; font-size: 14px; color: #cbd5e1; text-align: left; }
.nb-menu-item:hover { color: #f8fafc; background: rgba(255,255,255,0.05); }
.nb-menu-item.is-danger:hover { color: #fca5a5; background: rgba(248,113,113,0.08); }

.nb-burger { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; color: #cbd5e1; }
.nb-burger:hover { background: rgba(255,255,255,0.05); }

.nb-sheet {
  pointer-events: auto; width: min(100%, 1240px); margin: 8px auto 0; padding: 10px; border-radius: 20px;
  background: #0c0e14; border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 30px 70px -20px rgba(0,0,0,0.9); animation: nb-in .18s ease-out;
}
.nb-sheet-next { display: flex; align-items: center; gap: 10px; padding: 12px; margin-bottom: 6px; border-radius: 14px; font-size: 14px; color: #cbd5e1; background: rgba(255,255,255,0.03); }
.nb-sheet-links { display: grid; gap: 2px; }
.nb-sheet-link { padding: 12px; border-radius: 12px; font-size: 16px; font-weight: 500; color: #cbd5e1; }
.nb-sheet-link.is-active { color: #f8fafc; background: rgba(255,255,255,0.06); }
.nb-sheet-account { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.07); display: grid; gap: 2px; }
.nb-sheet-auth { margin-top: 8px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.07); display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.nb-sheet-auth a { justify-content: center; text-align: center; padding: 11px; }

@media (min-width: 900px) {
  .nb-links { display: flex; }
  .nb-auth { display: flex; }
  .nb-burger { display: none; }
  .nb-sheet { display: none; }
}
@media (min-width: 1180px) {
  .nb-ticker { display: inline-flex; }
}
@media (max-width: 899px) {
  .nb-avatar-btn .h-3\\.5 { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .nb-bar, .nb-link, .nb-cta, .nb-ticker { transition: none; }
  .nb-menu, .nb-sheet { animation: none; }
  .nb-ticker.is-live .nb-ticker-dot { animation: none; }
}
`;
