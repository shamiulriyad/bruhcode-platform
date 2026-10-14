import { startTransition, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PROFILE_PATHS = ['/profile', '/dashboard'];
const PROFILE_SECTIONS = ['overview', 'saved'];

const ICONS = {
  overview: 'M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z',
  saved: 'M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1Z',
  brain: 'm8 9-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
  contests: 'M4 6h16M4 12h16M4 18h10',
  calendar: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  rooms: 'M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-5A3.5 3.5 0 0 0 4 17.5V19M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3 3 0 0 1 0 5.7',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10',
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="ps-icon" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function initialsOf(user) {
  const source = user?.displayName || user?.username || user?.email || 'C';
  return source
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/* Highlights the profile section currently in view (Overview / Saved contests). */
function useActiveSection(enabled) {
  const [active, setActive] = useState('overview');
  useEffect(() => {
    if (!enabled) return undefined;
    const sections = PROFILE_SECTIONS.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [enabled]);
  return active;
}

export default function ProfileSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onProfile = PROFILE_PATHS.includes(pathname);
  const activeSection = useActiveSection(onProfile);

  const items = [
    { id: 'overview', label: 'Overview', icon: 'overview', section: true },
    { id: 'saved', label: 'Saved contests', icon: 'saved', section: true },
    { id: 'braingym', label: 'Brain Gym stats', icon: 'brain', to: '/profile/brain-gym' },
    { id: 'settings', label: 'Settings', icon: 'settings', to: '/profile/settings' },
  ];
  const shortcuts = [
    { label: 'Browse contests', icon: 'contests', to: '/' },
    { label: 'Calendar', icon: 'calendar', to: '/calendar' },
    { label: 'Practice rooms', icon: 'rooms', to: '/rooms' },
  ];

  const isActive = (item) => (item.section ? onProfile && activeSection === item.id : pathname === item.to);

  const goToSection = (id) => {
    if (onProfile) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/profile', { state: { scrollTo: id } });
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  return (
    <aside className="ps-root lg:sticky lg:top-24 lg:self-start">
      <style>{STYLES}</style>

      <div className="ps-card">
        {/* Identity */}
        <div className="ps-user">
          <div className="ps-avatar">
            {user?.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initialsOf(user)
            )}
          </div>
          <div className="min-w-0">
            <div className="ps-name">{user?.displayName || 'Coder'}</div>
            <div className="ps-handle">@{user?.username || user?.email?.split('@')[0]}</div>
          </div>
        </div>
        {memberSince && <div className="ps-since">Member since {memberSince}</div>}

        {/* Main navigation */}
        <nav aria-label="Profile" className="ps-nav">
          <div className="ps-group-label">Account</div>
          <ul className="ps-list">
            {items.map((item) => {
              const active = isActive(item);
              const className = active ? 'ps-link is-active' : 'ps-link';
              return (
                <li key={item.id}>
                  {item.section ? (
                    <button type="button" className={className} aria-current={active ? 'true' : undefined} onClick={() => goToSection(item.id)}>
                      <Icon name={item.icon} /> <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link to={item.to} className={className} aria-current={active ? 'page' : undefined}>
                      <Icon name={item.icon} /> <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="ps-group-label ps-hide-mobile">Shortcuts</div>
          <ul className="ps-list ps-hide-mobile">
            {shortcuts.map((s) => (
              <li key={s.to}>
                <Link to={s.to} className="ps-link"><Icon name={s.icon} /> <span>{s.label}</span></Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="ps-logout"
          onClick={() => startTransition(() => {
            // Same transition as the route change, so protected pages don't bounce to /login
            navigate('/');
            logout();
          })}
        >
          <Icon name="logout" /> <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

.ps-root { font-family: 'DM Sans', system-ui, sans-serif; }
.ps-card {
  position: relative; padding: 20px; border-radius: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012));
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 30px 80px -40px rgba(0,0,0,0.8);
  backdrop-filter: blur(16px);
}
.ps-card::before {
  content: ''; position: absolute; inset: 0 24px auto; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(125,211,252,0.45), transparent);
}

.ps-user { display: flex; align-items: center; gap: 14px; }
.ps-avatar {
  flex-shrink: 0; width: 52px; height: 52px; border-radius: 16px; overflow: hidden;
  display: grid; place-items: center; font-weight: 700; font-size: 18px; color: #04121c;
  background: linear-gradient(135deg, #7dd3fc, #6ee7b7);
  box-shadow: 0 10px 30px -10px rgba(56,189,248,0.6), inset 0 1px 0 rgba(255,255,255,0.5);
}
.ps-name { font-weight: 600; font-size: 16px; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ps-handle { margin-top: 2px; font-size: 13px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ps-since { margin-top: 14px; padding: 8px 12px; border-radius: 10px; font-size: 12px; color: #7c879b; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05); }

.ps-nav { margin-top: 20px; }
.ps-group-label { margin: 18px 12px 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #475569; }
.ps-group-label:first-child { margin-top: 0; }
.ps-list { display: grid; gap: 2px; }
.ps-link {
  position: relative; width: 100%; display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 12px; font-size: 14px; font-weight: 500; color: #94a3b8; text-align: left;
  transition: color .2s ease, background .2s ease;
}
.ps-link:hover { color: #f1f5f9; background: rgba(255,255,255,0.04); }
.ps-link.is-active { color: #f0f9ff; background: linear-gradient(90deg, rgba(56,189,248,0.16), rgba(56,189,248,0.04)); }
.ps-link.is-active::before {
  content: ''; position: absolute; left: -20px; top: 10px; bottom: 10px; width: 3px; border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, #7dd3fc, #6ee7b7); box-shadow: 0 0 12px rgba(56,189,248,0.6);
}
.ps-link.is-active .ps-icon { color: #7dd3fc; }
.ps-icon { width: 18px; height: 18px; flex-shrink: 0; color: #64748b; transition: color .2s ease; }
.ps-link:hover .ps-icon { color: #cbd5e1; }

.ps-logout {
  margin-top: 20px; width: 100%; display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 12px; font-size: 14px; font-weight: 500; color: #94a3b8;
  border-top: 1px solid rgba(255,255,255,0.06); border-radius: 0 0 12px 12px; padding-top: 16px;
  transition: color .2s ease;
}
.ps-logout:hover { color: #fca5a5; }
.ps-logout:hover .ps-icon { color: #fca5a5; }

/* Phone & tablet: compact card with a horizontal tab strip */
@media (max-width: 1023px) {
  .ps-card { padding: 16px; }
  .ps-nav { margin-top: 14px; }
  .ps-nav > .ps-group-label, .ps-hide-mobile, .ps-since { display: none; }
  .ps-list { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 -4px; padding: 0 4px; }
  .ps-list::-webkit-scrollbar { display: none; }
  .ps-link { white-space: nowrap; width: auto; border: 1px solid rgba(255,255,255,0.07); }
  .ps-link.is-active { border-color: rgba(56,189,248,0.35); }
  .ps-link.is-active::before { display: none; }
  .ps-logout { margin-top: 12px; padding: 12px 4px 0; }
  .ps-list.ps-hide-mobile { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ps-link, .ps-icon, .ps-logout { transition: none; }
}
`;
