import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getInitials(user) {
  const source = user?.displayName || user?.username || user?.email || 'CP';
  return source
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ProfileSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { label: 'Overview', icon: '📊', id: 'overview' },
    { label: 'Statistics', icon: '📈', id: 'stats' },
    { label: 'Saved Contests', icon: '🔖', id: 'saved' },
    { label: 'Brain Gym', icon: '🧠', id: 'braingym' },
    { label: 'Settings', icon: '⚙️', id: 'settings' },
  ];

  const activeClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
      isActive
        ? 'bg-sky-500/20 text-sky-400 border-l-2 border-sky-500 shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium text-slate-400 hover:text-white transition-all"
        >
          <span className="text-lg">☰</span>
          {isMobileOpen ? 'Hide Menu' : 'Show Menu'}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`lg:sticky lg:top-20 lg:self-start ${
          isMobileOpen ? 'block' : 'hidden lg:block'
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl">
          {/* User Info Card */}
          <div className="border-b border-white/5 bg-gradient-to-br from-sky-500/10 via-slate-900/10 to-emerald-500/10 p-5">
            <div className="flex items-start gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 text-lg font-bold text-slate-950 ring-2 ring-white/10">
                {user?.profilePictureUrl ? (
                  <img
                    src={user.profilePictureUrl}
                    alt={user?.displayName || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(user)
                )}
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="text-base font-semibold text-white truncate">
                  {user?.displayName || 'User'}
                </div>
                <div className="mt-1 text-xs text-slate-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400"></div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Bio</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {user?.bio?.trim() || 'Add a short bio to make your profile feel more personal and premium.'}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex flex-col gap-1 p-3">
            {menuItems.map((item) => {
              const isActive = item.id === 'settings'
                ? location.pathname === '/profile/settings'
                : item.id === 'braingym'
                ? location.pathname === '/profile/brain-gym'
                : (location.pathname === '/profile' || location.pathname === '/dashboard');

              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileOpen(false);
                    if (item.id === 'settings') {
                      navigate('/profile/settings');
                      return;
                    }
                    if (item.id === 'braingym') {
                      navigate('/profile/brain-gym');
                      return;
                    }
                    const isProfilePage = location.pathname === '/profile' || location.pathname === '/dashboard';
                    if (isProfilePage) {
                      const target = document.getElementById(item.id);
                      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      navigate('/profile', { state: { scrollTo: item.id } });
                    }
                  }}
                  className={`${activeClass({ isActive })} cursor-pointer rounded-xl`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Quick Stats */}
          <div className="border-t border-white/5 bg-black/20 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Quick Stats
            </div>
            <div className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">Joined</span>
                <span className="text-white font-mono text-xs">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="h-px bg-white/5"></div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">Status</span>
                <span className="text-emerald-400 text-xs font-semibold">🟢 Active</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 font-medium transition-all hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-sm group"
            >
              <span className="text-lg">🚪</span>
              <span className="transition-colors group-hover:text-red-200">Logout</span>
            </button>
          </div>
        </div>
      </aside>

    </>
  );
}
