import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const links = [
    { label: 'Contests', path: '/' },
    { label: 'Calendar', path: '/calendar' },
    { label: 'Practice', path: '/rooms' },
    { label: 'Brain Gym', path: '/games' },
    { label: 'About', path: '/about' },
  ];

  const visibleLinks = links.filter(l => {
    if (l.path === '/calendar' && !isAuthenticated) return false;
    if (l.path === '/rooms' && !isAuthenticated) return false;
    if (l.path === '/games' && !isAuthenticated) return false;
    return true;
  });

  // একটি উন্নত একটিভ ক্লাস ডিজাইন
  const navClass = ({ isActive }) =>
    `relative rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ease-out ${
      isActive 
        ? 'bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)] ring-1 ring-sky-500/50' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
        
        {/* লোগো সেকশন - গ্রাডিয়েন্ট গ্লো সহ */}
        <Link to="/" className="group flex items-center gap-3">
          <Logo size={36} />
          <div>
            <div className="text-xl font-bold tracking-tight text-white group-hover:text-sky-400 transition-colors">
              Code<span className="text-sky-400">Pulse</span>
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Contest Hub
            </div>
          </div>
        </Link>

        {/* নেভিগেশন লিংক - মডার্ন স্টাইল */}
          <nav className="hidden md:flex flex-wrap items-center justify-center gap-1 p-1 rounded-full bg-white/5 border border-white/5">
          {visibleLinks.map((link) => (
            <NavLink key={link.path} to={link.path} className={navClass} end={link.path === '/'}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="md:hidden">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 border border-white/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        {mobileOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 px-4">
            <div className="flex flex-col gap-2 rounded-lg bg-slate-900/95 border border-white/5 p-3">
              {links.map((link) => (
                <NavLink key={link.path} to={link.path} className={({isActive}) => `px-3 py-2 rounded ${isActive ? 'bg-sky-500/10 text-sky-300' : 'text-slate-300'}`} onClick={() => setMobileOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* ইউজার অ্যাকশন সেকশন */}
        <div className="flex items-center justify-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-medium text-slate-400">Welcome,</div>
                <div className="text-sm font-semibold text-white">
                   {user?.displayName?.split(' ')[0] || 'Coder'}
                </div>
              </div>
              
              <Link
                to="/profile"
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-sky-500/10 border border-sky-500/30 px-4 py-2 text-sm font-medium text-sky-300 transition-all hover:bg-sky-500/20 hover:border-sky-500/50 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)]"
              >
                <span className="text-lg">👤</span>
                <span className="relative z-10 transition-colors">Profile</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-400 transition hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-sky-500 px-6 py-2.5 text-sm font-bold text-slate-950 transition-all hover:bg-sky-400 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}