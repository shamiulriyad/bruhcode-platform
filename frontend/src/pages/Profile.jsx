import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProfileSidebar from '../components/ProfileSidebar';
import ContestCard from '../components/ContestCard';
import { userAPI } from '../api';
import { useAuth } from '../context/AuthContext';

/* ─── Platform config (colors unchanged) ──────────────────────── */
const PLATFORM_META = {
  Codeforces:    { color: '#FF4D4D', abbr: 'CF'  },
  LeetCode:      { color: '#FFA116', abbr: 'LC'  },
  AtCoder:       { color: '#00C896', abbr: 'AC'  },
  CodeChef:      { color: '#A0855B', abbr: 'CC'  },
  GeeksforGeeks: { color: '#0F9D58', abbr: 'GFG' },
};
const DEFAULT_META = { color: '#818cf8', abbr: '??' };

/* ─── easeOutCubic count-up hook ──────────────────────────────── */
function useCountUp(target = 0, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ─── Telemetry stat readout ──────────────────────────────────── */
function StatReadout({ label, value, accent, glyph, delay = 0 }) {
  const count = useCountUp(value);
  return (
    <div
      className="pf-stat"
      style={{ '--accent': accent, animationDelay: `${delay}s` }}
    >
      <div className="pf-stat__edge" />
      <div className="pf-stat__head">
        <span className="pf-stat__label">{label}</span>
        <span className="pf-stat__glyph" aria-hidden>{glyph}</span>
      </div>
      <div className="pf-stat__value">{count}</div>
      <div className="pf-stat__track"><span className="pf-stat__pip" /></div>
    </div>
  );
}

/* ─── Animated platform bar ───────────────────────────────────── */
function PlatformBar({ platform, count, total, mounted, delay }) {
  const meta = PLATFORM_META[platform] || DEFAULT_META;
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="pf-bar" style={{ animationDelay: `${delay}s` }}>
      <div className="pf-bar__top">
        <div className="pf-bar__id">
          <span className="pf-bar__chip" style={{ color: meta.color, borderColor: `${meta.color}40`, background: `${meta.color}14` }}>
            {meta.abbr}
          </span>
          <span className="pf-bar__name">{platform}</span>
        </div>
        <span className="pf-bar__num" style={{ color: meta.color }}>
          {count}<span className="pf-bar__pct"> · {pct}%</span>
        </span>
      </div>
      <div className="pf-bar__track">
        <div
          className="pf-bar__fill"
          style={{
            width: mounted ? `${pct}%` : '0%',
            background: `linear-gradient(90deg, ${meta.color}66, ${meta.color})`,
            boxShadow: `0 0 12px ${meta.color}55`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Identity row ────────────────────────────────────────────── */
function IdentityRow({ label, value, accent }) {
  return (
    <div className="pf-row" style={{ '--accent': accent }}>
      <span className="pf-row__tick" />
      <span className="pf-row__key">{label}</span>
      <span className="pf-row__val" style={{ color: value ? accent : '#475569' }}>
        {value || '— not set'}
      </span>
    </div>
  );
}

/* ─── Quick tip chip ──────────────────────────────────────────── */
function TipChip({ icon, text, accent, delay }) {
  return (
    <div className="pf-tip" style={{ '--accent': accent, animationDelay: `${delay}s` }}>
      <span className="pf-tip__icon">{icon}</span>
      <span className="pf-tip__text">{text}</span>
    </div>
  );
}

/* ─── Main Profile Component ───────────────────────────────────── */
export default function Profile() {
  const { user } = useAuth();
  const location = useLocation();
  const [savedContests, setSavedContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [brainGymStats, setBrainGymStats] = useState([]);

  useEffect(() => {
    if (location.state?.scrollTo) {
      const targetId = location.state.scrollTo;
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => {
        const target = document.getElementById(targetId);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const loadSavedContests = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getSavedContests();
      const contests = response.data
        .map((item) => ({ ...(item.contest || {}), savedContestId: item.id, status: item.status }))
        .filter((c) => c.id);
      setSavedContests(contests);
    } catch (err) {
      toast.error(err?.response?.data || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadBrainGymStats = async () => {
    try {
      const { data } = await userAPI.getProfile();
      setBrainGymStats(data.brainGymStats || []);
    } catch (err) {
      // Non-critical — silently fail
      console.warn('Could not load brain gym stats', err);
    }
  };

  useEffect(() => { loadSavedContests(); loadBrainGymStats(); }, []);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, [savedContests]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      saved: savedContests.length,
      live: savedContests.filter((c) => {
        const s = new Date(c.startTime).getTime();
        return s <= now && s + c.duration * 60000 > now;
      }).length,
      upcoming: savedContests.filter((c) => new Date(c.startTime).getTime() > now).length,
      platforms: new Set(savedContests.map((c) => c.platform)).size,
    };
  }, [savedContests]);

  const platformCounts = useMemo(() =>
    savedContests.reduce((acc, c) => {
      acc[c.platform] = (acc[c.platform] || 0) + 1;
      return acc;
    }, {}),
    [savedContests]
  );

  /* grouped identity fields — same data, new structure */
  const identityGroups = [
    {
      title: 'Identity',
      fields: [
        { label: 'Display Name', value: user?.displayName, accent: '#f1f5f9' },
        { label: 'Username',     value: user?.username,    accent: '#38bdf8' },
        { label: 'Email',        value: user?.email,       accent: '#7dd3fc' },
        { label: 'Joined',       value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : null, accent: '#a78bfa' },
      ],
    },
    {
      title: 'Academic',
      fields: [
        { label: 'University', value: user?.university, accent: '#34d399' },
        { label: 'Department', value: user?.department, accent: '#fbbf24' },
      ],
    },
    {
      title: 'Handles',
      fields: [
        { label: 'Codeforces', value: user?.codeforceHandle,   accent: '#f87171' },
        { label: 'LeetCode',   value: user?.leetcodeUsername, accent: '#f59e0b' },
      ],
    },
  ];

  const removeContest = async (contestId) => {
    try {
      await userAPI.removeContest(contestId);
      toast.success('Removed from profile');
      await loadSavedContests();
    } catch (err) {
      toast.error(err?.response?.data || 'Could not remove contest');
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'coder';
  const initials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'C';

  const today = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600;700&display=swap');

        .pf-root, .pf-root * { box-sizing: border-box; }
        .pf-root { font-family: 'DM Sans', sans-serif; position: relative; }

        /* ── ambient animated backdrop ── */
        .pf-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .pf-bg__grid {
          position: absolute; inset: -2px;
          background-image:
            linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 80%);
          animation: gridDrift 22s linear infinite;
        }
        .pf-bg__glow-a, .pf-bg__glow-b { position: absolute; border-radius: 50%; filter: blur(80px); }
        .pf-bg__glow-a { top: -120px; right: 8%; width: 360px; height: 360px; background: rgba(14,165,233,0.14); animation: float 14s ease-in-out infinite; }
        .pf-bg__glow-b { bottom: -160px; left: -60px; width: 420px; height: 420px; background: rgba(16,185,129,0.10); animation: float 18s ease-in-out infinite reverse; }

        @keyframes gridDrift { to { background-position: 46px 46px; } }
        @keyframes float { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(28px) translateX(-18px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ring { 0% { transform: scale(.85); opacity: .55; } 70% { transform: scale(1.6); opacity: 0; } 100% { opacity: 0; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(900%); } }

        /* ── shared panel ── */
        .pf-panel {
          position: relative; z-index: 1; overflow: hidden;
          background: rgba(10,10,25,0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          backdrop-filter: blur(16px);
          animation: fadeUp .55s ease both;
        }
        .pf-panel__edge {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent, #38bdf8), transparent);
          opacity: .75;
        }
        .pf-eyebrow {
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
          letter-spacing: .18em; text-transform: uppercase; color: #475569;
          display: flex; align-items: center; gap: 8px;
        }
        .pf-eyebrow::before { content: ''; width: 14px; height: 1px; background: var(--accent, #38bdf8); opacity: .6; }

        /* ── HERO ── */
        .pf-hero {
          position: relative; z-index: 1; overflow: hidden;
          display: flex; align-items: center; gap: 26px; flex-wrap: wrap;
          padding: 34px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.07);
          background: linear-gradient(135deg, #07071a 0%, #0c0c22 60%, #07071a 100%);
          animation: fadeUp .55s ease .05s both;
        }
        .pf-hero::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse at 75% 0%, rgba(99,102,241,0.14) 0%, transparent 60%),
            radial-gradient(ellipse at 5% 120%, rgba(20,184,166,0.09) 0%, transparent 55%);
        }
        .pf-hero::after {
          content: ''; position: absolute; left: 0; right: 0; top: 0; height: 36px;
          background: linear-gradient(rgba(56,189,248,0.18), transparent);
          animation: scan 6.5s linear infinite; opacity: .4;
        }
        .pf-avatar-wrap { position: relative; flex-shrink: 0; }
        .pf-avatar {
          position: relative; z-index: 2;
          width: 84px; height: 84px; border-radius: 22px;
          display: grid; place-items: center;
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 30px; color: #f1f5f9;
          background: linear-gradient(140deg, rgba(14,165,233,0.9), rgba(16,185,129,0.75));
          box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 18px 40px -12px rgba(14,165,233,0.6);
          letter-spacing: -.02em;
        }
        .pf-avatar-ring {
          position: absolute; inset: 0; border-radius: 22px;
          border: 1px solid rgba(14,165,233,0.6);
          animation: ring 2.6s ease-out infinite;
        }
        .pf-hero__body { position: relative; z-index: 1; flex: 1; min-width: 240px; }
        .pf-hero__title {
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: 40px;
          color: #f1f5f9; letter-spacing: -.03em; line-height: 1.05; margin: 8px 0 12px;
        }
        .pf-hero__title b { color: #38bdf8; font-weight: 700; }
        .pf-hero__sub { font-size: 15px; color: #94a3b8; line-height: 1.6; max-width: 540px; }
        .pf-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
        .pf-pill {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600;
          padding: 7px 13px; border-radius: 999px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: #94a3b8;
        }
        .pf-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; animation: blink 1.6s ease infinite; }

        /* ── STAT STRIP ── */
        .pf-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .pf-stat {
          position: relative; z-index: 1; overflow: hidden;
          background: rgba(10,10,25,0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 20px 22px;
          backdrop-filter: blur(16px);
          animation: fadeUp .55s ease both;
          transition: transform .35s cubic-bezier(.22,1,.36,1), border-color .35s, box-shadow .35s;
        }
        .pf-stat:hover {
          transform: translateY(-5px);
          border-color: color-mix(in srgb, var(--accent) 45%, transparent);
          box-shadow: 0 22px 44px -22px var(--accent);
        }
        .pf-stat__edge { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: .7; }
        .pf-stat__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .pf-stat__label { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: .15em; text-transform: uppercase; color: #475569; }
        .pf-stat__glyph { font-size: 14px; opacity: .85; }
        .pf-stat__value { font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 700; color: #f1f5f9; letter-spacing: -.04em; line-height: 1; }
        .pf-stat__track { margin-top: 14px; height: 3px; border-radius: 10px; background: rgba(255,255,255,0.05); overflow: hidden; }
        .pf-stat__pip { display: block; height: 100%; width: 38%; border-radius: 10px; background: var(--accent); box-shadow: 0 0 8px var(--accent); }

        /* ── DASHBOARD ROW (identity + platforms) ── */
        .pf-deck { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; }
        .pf-panel__pad { padding: 24px; }
        .pf-panel__title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #f8fafc; letter-spacing: -.02em; margin: 8px 0 0; }

        .pf-group + .pf-group { margin-top: 18px; padding-top: 16px; border-top: 1px dashed rgba(255,255,255,0.07); }
        .pf-group__label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: #334155; margin-bottom: 8px; }
        .pf-row {
          display: grid; grid-template-columns: 4px 130px 1fr; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 12px;
          transition: background .25s;
        }
        .pf-row:hover { background: rgba(255,255,255,0.03); }
        .pf-row__tick { width: 4px; height: 4px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 6px var(--accent); }
        .pf-row__key { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #64748b; letter-spacing: .02em; }
        .pf-row__val { font-size: 14px; font-weight: 600; word-break: break-word; }

        .pf-bar { padding: 11px 0; animation: fadeUp .45s ease both; }
        .pf-bar__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .pf-bar__id { display: flex; align-items: center; gap: 10px; }
        .pf-bar__chip { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 7px; border: 1px solid; letter-spacing: .04em; }
        .pf-bar__name { font-size: 13px; font-weight: 600; color: #94a3b8; }
        .pf-bar__num { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; }
        .pf-bar__pct { color: #334155; font-weight: 400; }
        .pf-bar__track { height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; }
        .pf-bar__fill { height: 100%; border-radius: 10px; transition: width 1s cubic-bezier(.22,1,.36,1); }

        /* ── TIPS ── */
        .pf-tips { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
        .pf-tip {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; border-radius: 16px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          animation: fadeUp .5s ease both;
          transition: transform .3s, border-color .3s, background .3s;
        }
        .pf-tip:hover { transform: translateX(4px); border-color: color-mix(in srgb, var(--accent) 40%, transparent); background: rgba(255,255,255,0.04); }
        .pf-tip__icon { font-size: 17px; flex-shrink: 0; }
        .pf-tip__text { font-size: 13px; color: #64748b; line-height: 1.55; }

        /* ── SAVED ── */
        .pf-saved-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .pf-badge { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; color: #0ea5e9; background: rgba(14,165,233,0.12); border: 1px solid rgba(14,165,233,0.25); padding: 3px 9px; border-radius: 999px; }
        .pf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .pf-skel { position: relative; overflow: hidden; height: 280px; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); }
        .pf-skel::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); animation: shimmer 1.5s infinite; }
        .pf-empty { text-align: center; padding: 56px 24px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px; color: #64748b; background: rgba(255,255,255,0.02); animation: fadeUp .5s ease both; }
        .pf-empty__icon { font-size: 42px; margin-bottom: 12px; }
        .pf-empty__t { font-size: 16px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; }

        /* ── BRAIN GYM STATS ── */
        .pf-gym { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
        .pf-gym-card {
          position: relative; overflow: hidden;
          background: rgba(10,10,25,0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 22px 24px;
          backdrop-filter: blur(16px);
          animation: fadeUp .55s ease both;
          transition: transform .35s cubic-bezier(.22,1,.36,1), border-color .35s, box-shadow .35s;
        }
        .pf-gym-card:hover {
          transform: translateY(-5px);
          border-color: rgba(14,165,233,0.35);
          box-shadow: 0 22px 44px -22px rgba(14,165,233,0.25);
        }
        .pf-gym-card__edge { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #0ea5e9, transparent); opacity: .7; }
        .pf-gym-card__title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .pf-gym-card__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .pf-gym-metric { text-align: center; padding: 10px 8px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.04); }
        .pf-gym-metric__val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; line-height: 1; }
        .pf-gym-metric__label { font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: .15em; text-transform: uppercase; color: #475569; margin-top: 4px; }
        .pf-gym-empty {
          text-align: center; padding: 40px 24px; border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 16px; color: #64748b; background: rgba(255,255,255,0.02);
          animation: fadeUp .5s ease both;
        }
        .pf-gym-empty__icon { font-size: 38px; margin-bottom: 10px; }
        .pf-gym-empty__t { font-size: 15px; font-weight: 600; color: #94a3b8; margin-bottom: 6px; }
        .pf-gym-cta {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 14px; padding: 10px 22px; border-radius: 999px;
          font-size: 13px; font-weight: 700;
          background: linear-gradient(135deg, rgba(14,165,233,0.15), rgba(16,185,129,0.15));
          border: 1px solid rgba(14,165,233,0.3);
          color: #38bdf8; text-decoration: none;
          transition: all .3s;
        }
        .pf-gym-cta:hover { background: linear-gradient(135deg, rgba(14,165,233,0.25), rgba(16,185,129,0.25)); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(14,165,233,0.2); }

        /* ── responsive ── */
        @media (max-width: 1280px) {
          .pf-deck { grid-template-columns: 1fr; }
          .pf-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .pf-hero__title { font-size: 32px; }
          .pf-hero { padding: 26px; }
        }
        @media (max-width: 640px) {
          .pf-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pf-root min-h-screen bg-slate-950">
        {/* ambient backdrop */}
        <div className="pf-bg" aria-hidden>
          <div className="pf-bg__grid" />
          <div className="pf-bg__glow-a" />
          <div className="pf-bg__glow-b" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* Sidebar */}
            <div>
              <ProfileSidebar />
            </div>

            {/* Main */}
            <div className="space-y-6">
              {/* HERO */}
              <div className="pf-hero">
                <div className="pf-avatar-wrap">
                  <div className="pf-avatar-ring" />
                  <div className="pf-avatar">{initials}</div>
                </div>
                <div className="pf-hero__body">
                  <div className="pf-eyebrow" style={{ '--accent': '#0ea5e9', color: '#0ea5e9' }}>
                    Welcome back, {displayName}
                  </div>
                  <h1 className="pf-hero__title">Command <b>Deck</b></h1>
                  <p className="pf-hero__sub">
                    Track your competitive-programming journey, schedule practice rooms, and stay ahead of every upcoming contest.
                  </p>
                  <div className="pf-pills">
                    <span className="pf-pill"><span className="pf-dot" /> System online</span>
                    <span className="pf-pill">📅 {today}</span>
                    <span className="pf-pill" style={{ color: '#10b981' }}>{stats.live} live now</span>
                  </div>
                </div>
              </div>

              {/* STAT STRIP */}
              <div id="stats" className="pf-stats">
                <StatReadout label="Total Saved" value={stats.saved}     accent="#0ea5e9" glyph="📌" delay={0.10} />
                <StatReadout label="Live Now"    value={stats.live}      accent="#06b6d4" glyph="🔴" delay={0.16} />
                <StatReadout label="Upcoming"    value={stats.upcoming}  accent="#10b981" glyph="↗" delay={0.22} />
                <StatReadout label="Platforms"   value={stats.platforms} accent="#f59e0b" glyph="◆"  delay={0.28} />
              </div>

              {/* DASHBOARD ROW: identity + platform breakdown side-by-side */}
              <div className="pf-deck">
                {/* Identity */}
                <section id="overview" className="pf-panel" style={{ '--accent': '#38bdf8', animationDelay: '.12s' }}>
                  <div className="pf-panel__edge" />
                  <div className="pf-panel__pad">
                    <div className="pf-eyebrow" style={{ '--accent': '#38bdf8' }}>Overview</div>
                    <h2 className="pf-panel__title">Account &amp; coding handles</h2>
                    <div style={{ marginTop: 18 }}>
                      {identityGroups.map((group) => (
                        <div className="pf-group" key={group.title}>
                          <div className="pf-group__label">{group.title}</div>
                          {group.fields.map((f) => (
                            <IdentityRow key={f.label} label={f.label} value={f.value} accent={f.accent} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Platform breakdown */}
                <section className="pf-panel" style={{ '--accent': '#10b981', animationDelay: '.18s' }}>
                  <div className="pf-panel__edge" />
                  <div className="pf-panel__pad">
                    <div className="pf-eyebrow" style={{ '--accent': '#10b981' }}>Platform Breakdown</div>
                    <h2 className="pf-panel__title">Where you compete</h2>
                    <div style={{ marginTop: 14 }}>
                      {Object.keys(platformCounts).length > 0 ? (
                        Object.entries(platformCounts).map(([platform, count], i) => (
                          <PlatformBar
                            key={platform}
                            platform={platform}
                            count={count}
                            total={stats.saved}
                            mounted={mounted}
                            delay={0.2 + i * 0.07}
                          />
                        ))
                      ) : (
                        <div style={{ padding: '28px 4px', color: '#475569', fontSize: 14 }}>
                          Save contests to see your platform distribution here.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              {/* BRAIN GYM STATS */}
              <section className="pf-panel" style={{ '--accent': '#0ea5e9', animationDelay: '.24s' }}>
                <div className="pf-panel__edge" />
                <div className="pf-panel__pad">
                  <div className="pf-eyebrow" style={{ '--accent': '#0ea5e9' }}>Brain Gym</div>
                  <h2 className="pf-panel__title">Game Performance</h2>
                  <div style={{ marginTop: 18 }}>
                    {brainGymStats.length > 0 ? (
                      <div className="pf-gym">
                        {brainGymStats.map((stat) => {
                          const gameLabel = stat.gameType === 'complexity_guess'
                            ? '⏱ Complexity Quiz'
                            : stat.gameType;
                          return (
                            <div className="pf-gym-card" key={stat.gameType}>
                              <div className="pf-gym-card__edge" />
                              <div className="pf-gym-card__title">
                                {gameLabel}
                              </div>
                              <div className="pf-gym-card__grid">
                                <div className="pf-gym-metric">
                                  <div className="pf-gym-metric__val" style={{ color: '#10b981' }}>
                                    {stat.accuracy}%
                                  </div>
                                  <div className="pf-gym-metric__label">Accuracy</div>
                                </div>
                                <div className="pf-gym-metric">
                                  <div className="pf-gym-metric__val" style={{ color: '#f59e0b' }}>
                                    {stat.bestStreak}
                                  </div>
                                  <div className="pf-gym-metric__label">Best Streak</div>
                                </div>
                                <div className="pf-gym-metric">
                                  <div className="pf-gym-metric__val" style={{ color: '#38bdf8' }}>
                                    {stat.totalCorrect}/{stat.totalAttempted}
                                  </div>
                                  <div className="pf-gym-metric__label">Correct</div>
                                </div>
                                <div className="pf-gym-metric">
                                  <div className="pf-gym-metric__val" style={{ color: '#a78bfa' }}>
                                    {Math.ceil(stat.totalAttempted / 10)}
                                  </div>
                                  <div className="pf-gym-metric__label">Games</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="pf-gym-empty">
                        <div className="pf-gym-empty__icon">🏋️‍♂️</div>
                        <div className="pf-gym-empty__t">No Brain Gym stats yet</div>
                        <div style={{ fontSize: 13 }}>Play games to sharpen your skills and track your progress here</div>
                        <Link to="/games/complexity" className="pf-gym-cta">
                          Try Brain Gym →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* TIPS */}
              <div className="pf-tips" style={{ animation: 'fadeUp .5s ease .35s both' }}>
                <TipChip icon="🔔" accent="#0ea5e9" text="Enable notifications for upcoming-contest alerts" delay={0.38} />
                <TipChip icon="💾" accent="#10b981" text="Bookmark contests to pin them to your profile" delay={0.43} />
                <TipChip icon="📅" accent="#f59e0b" text="Use the calendar view to plan your schedule" delay={0.48} />
              </div>

              {/* SAVED */}
              <div id="saved">
                <div className="pf-saved-head">
                  <div className="pf-eyebrow" style={{ '--accent': '#0ea5e9' }}>Your Saved Contests</div>
                  <span className="pf-badge">{stats.saved}</span>
                </div>

                {loading ? (
                  <div className="pf-grid">
                    {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="pf-skel" />)}
                  </div>
                ) : savedContests.length > 0 ? (
                  <div className="pf-grid">
                    {savedContests.map((contest) => (
                      <ContestCard
                        key={contest.id}
                        contest={contest}
                        onRemove={() => removeContest(contest.savedContestId)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="pf-empty">
                    <div className="pf-empty__icon">🎯</div>
                    <div className="pf-empty__t">No saved contests yet</div>
                    <div style={{ fontSize: 14 }}>Browse contests and bookmark your favorites to see them here</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
