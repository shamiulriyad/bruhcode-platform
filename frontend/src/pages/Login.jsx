import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI, statsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

/* ─── Keyframes & global styles ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes floatOrb {
    0%,100% { transform: translateY(0px) scale(1); }
    50%      { transform: translateY(-22px) scale(1.06); }
  }
  @keyframes orbPulse {
    0%,100% { opacity: 0.18; } 50% { opacity: 0.32; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes borderGlow {
    0%,100% { box-shadow: 0 0 0px 0px rgba(56,189,248,0); }
    50%      { box-shadow: 0 0 14px 3px rgba(56,189,248,0.18); }
  }
  @keyframes scanline {
    0%   { top: -6%; } 100% { top: 106%; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); } to { transform: rotate(360deg); }
  }
  @keyframes ripple {
    0%   { transform: scale(0); opacity: 0.5; }
    100% { transform: scale(4); opacity: 0; }
  }
  @keyframes platformFloat {
    0%,100% { transform: translateY(0px) scale(1); }
    50%      { transform: translateY(-8px) scale(1.03); }
  }
  @keyframes orbitRotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes orbitRotateReverse {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes counterRotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes counterRotateReverse {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulseRing {
    0%   { transform: scale(0.92); opacity: 0.6; }
    50%  { transform: scale(1.08); opacity: 0.2; }
    100% { transform: scale(0.92); opacity: 0.6; }
  }
  @keyframes centerPulse {
    0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(56,189,248,0.3); }
    50%      { transform: scale(1.06); box-shadow: 0 0 0 12px rgba(56,189,248,0); }
  }
  @keyframes tickerScroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes counterUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dotBlink {
    0%,100% { opacity: 1; } 50% { opacity: 0.2; }
  }

  .login-page * { font-family: 'Sora', sans-serif; box-sizing: border-box; }

  .anim-left  { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) both; }
  .anim-right { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.15s both; }

  .field-1 { animation: fadeUp 0.55s ease 0.35s both; }
  .field-2 { animation: fadeUp 0.55s ease 0.48s both; }
  .btn-anim { animation: fadeUp 0.55s ease 0.58s both; }
  .links-anim { animation: fadeIn 0.5s ease 0.7s both; }

  .orb { position: absolute; border-radius: 50%; filter: blur(56px); pointer-events: none; }
  .orb-1 { width:340px;height:340px; background:radial-gradient(circle,rgba(14,165,233,0.22),transparent 70%);
            top:-80px;left:-100px; animation: floatOrb 7s ease-in-out infinite, orbPulse 7s ease-in-out infinite; }
  .orb-2 { width:260px;height:260px; background:radial-gradient(circle,rgba(6,182,212,0.15),transparent 70%);
            bottom:-60px;right:-60px; animation: floatOrb 9s ease-in-out 1.5s infinite reverse, orbPulse 9s ease-in-out 1.5s infinite; }
  .orb-3 { width:180px;height:180px; background:radial-gradient(circle,rgba(52,211,153,0.12),transparent 70%);
            top:40%;left:50%; animation: floatOrb 11s ease-in-out 3s infinite, orbPulse 11s ease-in-out 3s infinite; }

  .scanline-wrap { position:absolute;inset:0;overflow:hidden;border-radius:1.25rem;pointer-events:none;z-index:1; }
  .scanline { position:absolute;left:0;right:0;height:2px;
    background:linear-gradient(90deg,transparent,rgba(56,189,248,0.12),transparent);
    animation: scanline 5s linear infinite; }

  .input-glow:focus { animation: borderGlow 1.8s ease-in-out infinite; }

  .btn-ripple { position:relative;overflow:hidden; }
  .btn-ripple .ripple-el {
    position:absolute;border-radius:50%;
    background:rgba(255,255,255,0.35);
    width:80px;height:80px;margin-top:-40px;margin-left:-40px;
    animation: ripple 0.6s linear forwards;
    pointer-events:none;
  }

  .noise {
    position:absolute;inset:0;border-radius:1.25rem;pointer-events:none;z-index:0;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    opacity:0.025;
  }

  /* Platform cards */
  .platform-card {
    transition: transform 0.3s cubic-bezier(.22,.68,0,1.2), box-shadow 0.3s ease, border-color 0.3s ease;
    cursor: default;
  }
  .platform-card:hover {
    transform: translateY(-4px) scale(1.04) !important;
  }

  /* Orbit rings */
  .orbit-ring-1 {
    animation: orbitRotate 18s linear infinite;
  }
  .orbit-ring-2 {
    animation: orbitRotateReverse 24s linear infinite;
  }
  .orbit-dot-1 {
    animation: counterRotate 18s linear infinite;
  }
  .orbit-dot-2 {
    animation: counterRotateReverse 24s linear infinite;
  }

  /* Ticker */
  .ticker-wrap { overflow: hidden; }
  .ticker-inner { display: flex; width: max-content; animation: tickerScroll 18s linear infinite; }
  .ticker-inner:hover { animation-play-state: paused; }

  /* Stat counter */
  .stat-num { animation: counterUp 0.6s ease both; }

  /* Live dot */
  .live-dot { animation: dotBlink 1.4s ease-in-out infinite; }

  /* Center logo pulse */
  .center-logo { animation: centerPulse 2.8s ease-in-out infinite; }

  /* Pulse rings */
  .pulse-ring-1 { animation: pulseRing 2.8s ease-in-out infinite; }
  .pulse-ring-2 { animation: pulseRing 2.8s ease-in-out 0.9s infinite; }
`;

/* ─── Platform data ─── */
const PLATFORMS = [
  {
    id: 'cf',
    name: 'Codeforces',
    short: 'CF',
    color: '#1a90ff',
    bg: 'rgba(26,144,255,0.12)',
    border: 'rgba(26,144,255,0.35)',
    glow: 'rgba(26,144,255,0.4)',
    stat: '800K+',
    label: 'contests held',
    floatDelay: '0s',
  },
  {
    id: 'lc',
    name: 'LeetCode',
    short: 'LC',
    color: '#ffa116',
    bg: 'rgba(255,161,22,0.12)',
    border: 'rgba(255,161,22,0.35)',
    glow: 'rgba(255,161,22,0.4)',
    stat: '3K+',
    label: 'problems',
    floatDelay: '0.4s',
  },
  {
    id: 'ac',
    name: 'AtCoder',
    short: 'AC',
    color: '#00bfae',
    bg: 'rgba(0,191,174,0.12)',
    border: 'rgba(0,191,174,0.35)',
    glow: 'rgba(0,191,174,0.4)',
    stat: '400+',
    label: 'rated contests',
    floatDelay: '0.8s',
  },
  {
    id: 'cc',
    name: 'CodeChef',
    short: 'CC',
    color: '#ff6b35',
    bg: 'rgba(255,107,53,0.12)',
    border: 'rgba(255,107,53,0.35)',
    glow: 'rgba(255,107,53,0.4)',
    stat: '50K+',
    label: 'participants',
    floatDelay: '1.2s',
  },
  {
    id: 'gfg',
    name: 'GeeksforGeeks',
    short: 'GFG',
    color: '#2f8d46',
    bg: 'rgba(47,141,70,0.12)',
    border: 'rgba(47,141,70,0.35)',
    glow: 'rgba(47,141,70,0.4)',
    stat: '1M+',
    label: 'articles',
    floatDelay: '1.6s',
  },
];

/* ─── Platform SVG Logos ─── */
function PlatformLogo({ id, color, size = 28 }) {
  const s = size;
  if (id === 'cf') return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="14" width="8" height="16" rx="2" fill={color}/>
      <rect x="12" y="8" width="8" height="22" rx="2" fill={color} opacity="0.7"/>
      <rect x="22" y="2" width="8" height="28" rx="2" fill={color} opacity="0.5"/>
    </svg>
  );
  if (id === 'lc') return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M12 8L6 16L12 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 16H26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="26" cy="16" r="3" fill={color}/>
    </svg>
  );
  if (id === 'ac') return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2.5"/>
      <path d="M10 20L14 12L18 18L21 14L24 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (id === 'cc') return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M16 4C10 4 6 9 6 16C6 23 10 28 16 28C19 28 21.5 26.5 23 24" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="16" cy="16" r="4" fill={color}/>
      <path d="M20 10L26 6M20 22L26 26" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  if (id === 'gfg') return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
      <path d="M4 16C4 16 8 10 16 10C20 10 24 12 24 12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M28 16C28 16 24 22 16 22C12 22 8 20 8 20" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="16" y1="10" x2="16" y2="22" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
  return null;
}

/* ─── Orbit Solar System animation ─── */
function PlatformOrbit() {
  return (
    <div style={{ position: 'relative', width: '100%', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer orbit ring */}
      <div className="orbit-ring-1" style={{
        position: 'absolute',
        width: 210, height: 210,
        borderRadius: '50%',
        border: '1px dashed rgba(56,189,248,0.2)',
      }}>
        {/* CF at top */}
        <div className="orbit-dot-1" style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: PLATFORMS[0].bg,
            border: `1.5px solid ${PLATFORMS[0].border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 10px ${PLATFORMS[0].glow}`,
          }}>
            <PlatformLogo id="cf" color={PLATFORMS[0].color} size={22} />
          </div>
        </div>
        {/* AC at bottom */}
        <div className="orbit-dot-1" style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: PLATFORMS[2].bg,
            border: `1.5px solid ${PLATFORMS[2].border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 10px ${PLATFORMS[2].glow}`,
          }}>
            <PlatformLogo id="ac" color={PLATFORMS[2].color} size={22} />
          </div>
        </div>
      </div>

      {/* Inner orbit ring */}
      <div className="orbit-ring-2" style={{
        position: 'absolute',
        width: 136, height: 136,
        borderRadius: '50%',
        border: '1px dashed rgba(52,211,153,0.2)',
      }}>
        {/* LC at right */}
        <div className="orbit-dot-2" style={{ position: 'absolute', top: '50%', right: -22, transform: 'translateY(-50%)' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: PLATFORMS[1].bg,
            border: `1.5px solid ${PLATFORMS[1].border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 10px ${PLATFORMS[1].glow}`,
          }}>
            <PlatformLogo id="lc" color={PLATFORMS[1].color} size={22} />
          </div>
        </div>
        {/* GFG at left */}
        <div className="orbit-dot-2" style={{ position: 'absolute', top: '50%', left: -22, transform: 'translateY(-50%)' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: PLATFORMS[4].bg,
            border: `1.5px solid ${PLATFORMS[4].border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 10px ${PLATFORMS[4].glow}`,
          }}>
            <PlatformLogo id="gfg" color={PLATFORMS[4].color} size={22} />
          </div>
        </div>
      </div>

      {/* Pulse rings */}
      <div className="pulse-ring-1" style={{
        position: 'absolute', width: 64, height: 64, borderRadius: '50%',
        border: '1.5px solid rgba(56,189,248,0.35)',
        pointerEvents: 'none',
      }} />
      <div className="pulse-ring-2" style={{
        position: 'absolute', width: 80, height: 80, borderRadius: '50%',
        border: '1px solid rgba(56,189,248,0.18)',
        pointerEvents: 'none',
      }} />

      {/* Center: CC */}
      <div className="center-logo" style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(255,107,53,0.22), rgba(255,107,53,0.08))',
        border: `2px solid ${PLATFORMS[3].border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <PlatformLogo id="cc" color={PLATFORMS[3].color} size={26} />
      </div>
    </div>
  );
}

/* ─── Ticker ─── */
const TICKER_ITEMS = [
  { platform: 'CF', name: 'Codeforces Round #987', time: 'in 2h', color: '#1a90ff' },
  { platform: 'LC', name: 'Weekly Contest 420', time: 'Tomorrow', color: '#ffa116' },
  { platform: 'AC', name: 'AtCoder Beginner 380', time: 'in 3d', color: '#00bfae' },
  { platform: 'CC', name: 'Starters 160', time: 'in 5d', color: '#ff6b35' },
  { platform: 'GFG', name: 'GFG Weekly 188', time: 'in 1d', color: '#2f8d46' },
];

function ContestTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d3ee' }} />
        <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
          Upcoming Contests
        </span>
      </div>
      <div className="ticker-wrap" style={{ borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 0' }}>
        <div className="ticker-inner">
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}40`,
              }}>
                {item.platform}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(226,232,240,0.85)', fontWeight: 500 }}>{item.name}</span>
              <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Stats row ─── */
function StatsRow() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await statsAPI.get();
        if (!mounted) return;
        setStats(res.data || null);
      } catch (err) {
        // ignore, keep defaults
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const formatCount = (n) => {
    if (!n && n !== 0) return '—';
    if (n >= 1000000) return `${Math.round(n / 100000) / 10}M`;
    if (n >= 1000) return `${Math.round(n / 100) / 10}K`;
    return String(n);
  };

  const row = [
    { value: formatCount(stats?.totalPlatforms ?? 0), label: 'Platforms', color: '#38bdf8' },
    { value: formatCount(stats?.lifetimeContests ?? stats?.totalContests ?? 0), label: 'Contests tracked', color: '#22d3ee' },
    { value: formatCount(stats?.totalUsers ?? 0), label: 'Active users', color: '#34d399' },
  ];

  return (
    <div style={{ display: 'flex', gap: 0, marginTop: 16, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
      {row.map((s, i) => (
        <div key={i} style={{
          flex: 1, padding: '10px 8px', textAlign: 'center',
          background: i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.04)',
          borderRight: i < row.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
        }}>
          <div className="stat-num" style={{ fontSize: 18, fontWeight: 700, color: s.color, animationDelay: `${i * 0.15 + 0.8}s` }}>
            {s.value}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.7)', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Animated input ─── */
function AnimInput({ label, className: cls, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <label className={`block text-sm text-slate-300 ${cls || ''}`} style={{ position: 'relative' }}>
      <span style={{ display: 'block', marginBottom: 8, transition: 'color 0.2s', color: focused ? '#38bdf8' : '' }}>{label}</span>
      <span style={{
        position: 'absolute', bottom: 0, left: '50%',
        height: 2,
        width: focused ? '100%' : '0%',
        background: 'linear-gradient(90deg,#38bdf8,#22d3ee)',
        transition: 'width 0.35s cubic-bezier(.4,0,.2,1)',
        transform: 'translateX(-50%)',
        borderRadius: 2, zIndex: 3,
      }} />
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        className="input-glow w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600"
        style={{
          borderColor: focused ? 'rgba(56,189,248,0.55)' : '',
          boxShadow: focused ? '0 0 0 3px rgba(56,189,248,0.1)' : 'none',
          transition: 'border-color 0.25s,box-shadow 0.25s',
        }}
      />
    </label>
  );
}

/* ─── Ripple button ─── */
function RippleButton({ children, ...props }) {
  const [ripples, setRipples] = useState([]);
  const add = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(r => [...r, { id, left: e.clientX - rect.left, top: e.clientY - rect.top }]);
    setTimeout(() => setRipples(r => r.filter(x => x.id !== id)), 620);
  };
  return (
    <button {...props} onMouseDown={add} className={`btn-ripple ${props.className || ''}`}>
      {ripples.map(r => <span key={r.id} className="ripple-el" style={{ left: r.left, top: r.top }} />)}
      {children}
    </button>
  );
}

/* ─── Main component ─── */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const submit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await authAPI.login(form);
      login(response.data);
      toast.success('Logged in successfully');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error?.response?.data || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="login-page relative w-full"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
          padding: '3rem 1rem',
          overflow: 'hidden',
        }}
      >
        {/* Global orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="relative mx-auto" style={{ maxWidth: 1200, zIndex: 10 }}>
          <div className="grid w-full gap-8 lg:grid-cols-2 items-center" style={{ alignItems: 'stretch' }}>

            {/* ── LEFT CARD — Platform Showcase ── */}
            <div
              className="anim-left rounded-[1.25rem] border border-white/6 bg-gradient-to-br from-[#041428]/60 via-[#071226]/50 to-[#041621]/60 p-6 shadow-xl"
              style={{ minHeight: 260, position: 'relative', overflow: 'hidden' }}
            >
              <div className="noise" />
              <div className="scanline-wrap"><div className="scanline" /></div>

              <div style={{ position: 'relative', zIndex: 3 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    borderRadius: 999,
                    border: '1px solid rgba(52,211,153,0.2)',
                    background: 'rgba(52,211,153,0.08)',
                    padding: '4px 12px',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: '#34d399',
                  }}>
                    <div className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                    All platforms
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}>Track everything</span>
                </div>

                {/* Orbit animation */}
                <PlatformOrbit />

                {/* Platform name labels row */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  {PLATFORMS.map(p => (
                    <span key={p.id} style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
                      background: p.bg, color: p.color, border: `1px solid ${p.border}`,
                      letterSpacing: '0.05em',
                    }}>
                      {p.short}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <StatsRow />

                {/* Contest ticker */}
                <ContestTicker />
              </div>

              {/* Corner glow accent */}
              <div style={{
                position: 'absolute', bottom: 0, right: 0, width: 120, height: 120,
                background: 'radial-gradient(circle at bottom right,rgba(56,189,248,0.08),transparent 70%)',
                borderRadius: '0 0 1.25rem 0', pointerEvents: 'none',
              }} />
            </div>

            {/* ── RIGHT CARD — Login form ── */}
            <form
              onSubmit={submit}
              className="anim-right rounded-[1.25rem] border border-white/6 bg-white/3 p-6 shadow-xl backdrop-blur-lg"
              style={{ minHeight: 260, position: 'relative', overflow: 'hidden' }}
            >
              <div className="noise" />
              <div className="scanline-wrap"><div className="scanline" style={{ animationDelay: '2.5s' }} /></div>

              <div style={{ position: 'relative', zIndex: 3 }}>
                <h2 className="text-2xl font-semibold text-white" style={{ animation: 'fadeUp 0.5s ease 0.2s both' }}>Welcome back</h2>
                <p className="mt-2 text-sm text-slate-400" style={{ animation: 'fadeUp 0.5s ease 0.28s both' }}>Use your account to continue.</p>

                <div className="field-1 mt-6">
                  <AnimInput
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="field-2 mt-4">
                  <AnimInput
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>

                <div className="btn-anim mt-6">
                  <RippleButton
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:opacity-95 disabled:opacity-60"
                  >
                    {loading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 0.8s linear infinite' }}>
                          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2"
                            strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
                        </svg>
                        Signing in...
                      </span>
                    ) : 'Sign in'}
                  </RippleButton>
                </div>

                <div className="links-anim">
                  <div className="mt-4 text-right">
                    <Link to="/forgot-password" className="text-sm font-medium text-sky-400 hover:text-sky-300" style={{ transition: 'color 0.2s' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <p className="mt-4 text-sm text-slate-400">
                    New here?{' '}
                    <Link to="/register" className="text-sky-400 hover:text-sky-300" style={{ transition: 'color 0.2s' }}>
                      Create an account
                    </Link>
                  </p>
                </div>
              </div>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}