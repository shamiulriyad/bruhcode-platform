import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ProfileSidebar from '../components/ProfileSidebar';
import { brainGymAPI } from '../api';
import { useAuth } from '../context/AuthContext';

function CountUp({ to, duration = 1200 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setCount(to);
      return;
    }
    let start = 0;
    const end = parseInt(to, 10);
    if (isNaN(end) || start === end) {
      setCount(to);
      return;
    }

    const range = end - start;
    const startTime = performance.now();

    const updateCount = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = progress * (2 - progress);
      setCount(Math.floor(start + easedProgress * range));

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [to, duration]);

  return <span>{count}</span>;
}

// List of all games in the system
const GAMES = [
  { type: 'complexity_guess', name: 'Complexity Quiz', path: '/games/complexity', active: true },
  { type: 'debug_the_code', name: 'Debug the Code', path: '/games/debug', active: true },
  { type: 'logic_ladder', name: 'Logic Puzzle Ladder', path: '#', active: false },
];

export default function BrainGymProfilePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGameType, setSelectedGameType] = useState('complexity_guess');
  const [rankData, setRankData] = useState(null);

  // Fetch consolidated overview
  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await brainGymAPI.getOverview();
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load Brain Gym data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch rank for selected game type
  const loadRank = async (gameType) => {
    try {
      const res = await brainGymAPI.getMyRank(gameType);
      setRankData(res.data);
    } catch (err) {
      console.warn('Failed to load rank', err);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (selectedGameType) {
      loadRank(selectedGameType);
    }
  }, [selectedGameType]);

  const hasPlayedAny = useMemo(() => {
    if (!data) return false;
    return data.overallStats?.totalGamesPlayed > 0;
  }, [data]);

  // Compute overall level/tier
  const overallLevel = useMemo(() => {
    if (!data) return { name: 'Beginner', color: '#64748b' };
    const correct = data.overallStats?.totalCorrect || 0;
    if (correct >= 150) return { name: 'Mastermind', color: '#c084fc' };
    if (correct >= 61) return { name: 'Strategist', color: '#38bdf8' };
    if (correct >= 21) return { name: 'Solver', color: '#34d399' };
    return { name: 'Beginner', color: '#94a3b8' };
  }, [data]);

  // Compute Achievements/Badges
  const badges = useMemo(() => {
    if (!data) return [];
    const stats = data.overallStats || { totalGamesPlayed: 0, bestStreak: 0, totalCorrect: 0 };
    const history = data.history || [];

    const hasPerfect = history.some((h) => h.accuracy === 100);

    return [
      {
        id: 'first_win',
        name: 'First Steps',
        desc: 'Played at least 1 game session.',
        earned: stats.totalGamesPlayed >= 1,
        icon: '🎯',
        color: '#38bdf8',
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        desc: 'Achieved a streak of 10 or more.',
        earned: stats.bestStreak >= 10,
        icon: '🔥',
        color: '#fbbf24',
      },
      {
        id: 'century_solver',
        name: 'Century Solver',
        desc: 'Answered 100+ questions correctly.',
        earned: stats.totalCorrect >= 100,
        icon: '💯',
        color: '#a78bfa',
      },
      {
        id: 'perfect_round',
        name: 'Perfect Round',
        desc: 'Completed a quiz with 100% accuracy.',
        earned: hasPerfect,
        icon: '🏆',
        color: '#f43f5e',
      },
      {
        id: 'logic_champ',
        name: 'Logic Champion',
        desc: 'Played 10+ games with 80%+ overall accuracy.',
        earned: stats.totalGamesPlayed >= 10 && stats.overallAccuracy >= 80,
        icon: '👑',
        color: '#34d399',
      },
    ];
  }, [data]);

  // Render loading state skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-sky-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-slate-400 font-mono text-sm">Synchronizing neural link...</span>
        </div>
      </div>
    );
  }

  const displayName = data?.user?.displayName || user?.displayName || user?.email?.split('@')[0] || 'coder';
  const initials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'C';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600;700&display=swap');

        .bg-root, .bg-root * { box-sizing: border-box; }
        .bg-root { font-family: 'DM Sans', sans-serif; position: relative; }

        .bg-backdrop { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .bg-backdrop__grid {
          position: absolute; inset: -2px;
          background-image:
            linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 80%);
        }
        .bg-backdrop__glow {
          position: absolute; top: -120px; right: 10%; width: 400px; height: 400px;
          background: rgba(14,165,233,0.12); border-radius: 50%; filter: blur(90px);
        }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        .bg-panel {
          position: relative; z-index: 1; overflow: hidden;
          background: rgba(10,10,25,0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          backdrop-filter: blur(16px);
          animation: fadeUp .5s ease both;
        }
        .bg-panel__edge {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent, #38bdf8), transparent);
          opacity: .75;
        }
        .bg-panel__pad { padding: 24px; }
        .bg-panel__title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #f8fafc; letter-spacing: -.02em; margin: 8px 0 0; }
        
        .bg-eyebrow {
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
          letter-spacing: .18em; text-transform: uppercase; color: var(--accent, #38bdf8);
          display: flex; align-items: center; gap: 8px;
        }
        .bg-eyebrow::before { content: ''; width: 14px; height: 1px; background: var(--accent, #38bdf8); opacity: .6; }

        /* Summary Header Banner */
        .bg-banner {
          display: flex; align-items: center; gap: 26px; flex-wrap: wrap;
          padding: 30px; border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.07);
          background: linear-gradient(135deg, #07071a 0%, #0c0c22 60%, #07071a 100%);
          animation: fadeUp .5s ease both;
          position: relative;
        }
        .bg-banner::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at 75% 0%, rgba(99,102,241,0.12) 0%, transparent 60%);
        }
        .bg-avatar {
          width: 80px; height: 80px; border-radius: 22px;
          display: grid; place-items: center;
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 28px; color: #f1f5f9;
          background: linear-gradient(140deg, #0ea5e9, #10b981);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 15px 35px -10px rgba(14,165,233,0.5);
        }
        .bg-tier-badge {
          display: inline-flex; align-items: center; gap: 6px;
          border-radius: 999px; padding: 4px 12px;
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
          letter-spacing: 0.05em; border: 1px solid;
        }

        /* Metrics Strip */
        .bg-banner-stats { display: flex; gap: 28px; flex-wrap: wrap; margin-top: 14px; }
        .bg-banner-stat { display: flex; flex-direction: column; }
        .bg-banner-stat__val { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; color: #f1f5f9; }
        .bg-banner-stat__lbl { font-family: 'JetBrains Mono', monospace; font-size: 10px; uppercase; color: #475569; margin-top: 2px; }

        /* Game Stats Cards */
        .bg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .bg-card {
          position: relative; overflow: hidden;
          background: rgba(10,10,25,0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 22px;
          backdrop-filter: blur(16px);
          animation: fadeUp .5s ease both;
          transition: transform .3s, border-color .3s, box-shadow .3s;
        }
        .bg-card:hover:not(.bg-card--locked) {
          transform: translateY(-4px);
          border-color: rgba(14,165,233,0.3);
          box-shadow: 0 16px 32px -16px rgba(14,165,233,0.3);
        }
        .bg-card--locked { opacity: 0.45; background: rgba(10,10,20,0.4); border-color: rgba(255,255,255,0.03); }
        .bg-card__title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: #f1f5f9; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
        .bg-card__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .bg-metric { text-align: center; padding: 8px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); }
        .bg-metric__val { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; }
        .bg-metric__label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #475569; margin-top: 2px; text-transform: uppercase; }
        
        .bg-btn {
          width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px; border-radius: 12px; font-size: 13px; font-weight: 700;
          text-decoration: none; transition: all .2s; border: 1px solid;
        }
        .bg-btn--primary {
          background: linear-gradient(135deg, rgba(14,165,233,0.15), rgba(16,185,129,0.15));
          border-color: rgba(14,165,233,0.35); color: #38bdf8;
        }
        .bg-btn--primary:hover {
          background: linear-gradient(135deg, rgba(14,165,233,0.25), rgba(16,185,129,0.25));
          box-shadow: 0 4px 12px rgba(14,165,233,0.15); transform: translateY(-1px);
        }
        .bg-btn--locked {
          background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); color: #475569;
          cursor: not-allowed;
        }

        /* Achievements Badges */
        .bg-badge-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
        .bg-badge-card {
          display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 16px;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
          transition: border-color .3s, background .3s;
        }
        .bg-badge-card--earned:hover { border-color: rgba(56,189,248,0.25); background: rgba(255,255,255,0.04); }
        .bg-badge-card--locked { opacity: 0.25; filter: grayscale(1); }
        .bg-badge-icon { font-size: 26px; }
        .bg-badge-name { font-size: 13px; font-weight: 600; color: #f1f5f9; }
        .bg-badge-desc { font-size: 10px; color: #64748b; margin-top: 2px; }

        /* Global Rank Card */
        .bg-rank-panel { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 768px) {
          .bg-rank-panel { grid-template-columns: 2fr 1fr; }
        }
        .bg-rank-card {
          padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);
          background: radial-gradient(circle at 90% 10%, rgba(14,165,233,0.08), transparent 60%);
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .bg-rank-num { font-family: 'Syne', sans-serif; font-size: 42px; font-weight: 800; color: #38bdf8; line-height: 1; }
        
        /* Table */
        .bg-table-wrap { overflow-x: auto; width: 100%; }
        .bg-table { width: 100%; border-collapse: collapse; text-align: left; }
        .bg-table th {
          font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
          letter-spacing: .15em; text-transform: uppercase; color: #475569;
          padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .bg-table td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #94a3b8; }
        .bg-table tr:hover td { background: rgba(255,255,255,0.015); color: #f1f5f9; }

        /* Empty State */
        .bg-empty {
          text-align: center; padding: 60px 24px; border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 20px; color: #64748b; background: rgba(255,255,255,0.01);
          animation: fadeUp .5s ease both;
        }
        .bg-empty__icon { font-size: 52px; margin-bottom: 14px; }
        .bg-empty__title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; }
        .bg-empty__desc { font-size: 13px; margin-bottom: 18px; max-width: 400px; margin-left: auto; margin-right: auto; }

        .bg-dropdown {
          background: rgba(10,10,25,0.8); border: 1px solid rgba(255,255,255,0.08);
          color: #f1f5f9; border-radius: 10px; padding: 8px 12px; font-size: 12px;
          outline: none; font-family: 'JetBrains Mono', monospace; font-weight: 600;
          cursor: pointer; transition: border-color 0.2s;
        }
        .bg-dropdown:focus { border-color: #38bdf8; }
      `}</style>

      <div className="bg-root min-h-screen bg-slate-950 text-slate-100">
        <div className="bg-backdrop" aria-hidden>
          <div className="bg-backdrop__grid" />
          <div className="bg-backdrop__glow" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* Sidebar */}
            <div>
              <ProfileSidebar />
            </div>

            {/* Main Content Area */}
            <div className="space-y-8">
              {/* 1. SUMMARY BANNER */}
              <div className="bg-banner">
                <div className="bg-avatar">{initials}</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="font-semibold text-2xl tracking-tight text-white">{displayName}</h1>
                    <span
                      className="bg-tier-badge"
                      style={{
                        color: overallLevel.color,
                        borderColor: `${overallLevel.color}40`,
                        background: `${overallLevel.color}14`,
                      }}
                    >
                      🛡️ {overallLevel.name}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1 font-mono">{data?.user?.email || user?.email}</p>
                  
                  <div className="bg-banner-stats">
                    <div className="bg-banner-stat">
                      <span className="bg-banner-stat__val">
                        <CountUp to={data?.overallStats?.totalGamesPlayed || 0} />
                      </span>
                      <span className="bg-banner-stat__lbl">Games Played</span>
                    </div>
                    <div className="bg-banner-stat">
                      <span className="bg-banner-stat__val" style={{ color: '#34d399' }}>
                        <CountUp to={data?.overallStats?.overallAccuracy || 0} />%
                      </span>
                      <span className="bg-banner-stat__lbl">Avg Accuracy</span>
                    </div>
                    <div className="bg-banner-stat">
                      <span className="bg-banner-stat__val" style={{ color: '#fbbf24' }}>
                        <CountUp to={data?.overallStats?.bestStreak || 0} />
                      </span>
                      <span className="bg-banner-stat__lbl">Best Streak</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* EMPTY STATE OR FULL INTERFACE */}
              {!hasPlayedAny ? (
                <div className="bg-empty">
                  <div className="bg-empty__icon">🏋️‍♂️</div>
                  <h3 className="bg-empty__title">Start Your Mental Training</h3>
                  <p className="bg-empty__desc">
                    You haven't played any logic games in the Brain Gym yet. Challenge yourself, sharpen your analysis speed, and track your streaks.
                  </p>
                  <Link to="/games/complexity" className="bg-btn bg-btn--primary" style={{ maxWidth: 200, margin: '0 auto' }}>
                    Start Your First Game →
                  </Link>
                </div>
              ) : (
                <>
                  {/* 2. PER-GAME STATS CARDS */}
                  <section className="space-y-4">
                    <div className="bg-eyebrow" style={{ '--accent': '#0ea5e9' }}>Module Diagnostics</div>
                    <h2 className="font-semibold text-xl text-white">Logic Games</h2>
                    
                    <div className="bg-grid">
                      {GAMES.map((game) => {
                        const scoreRow = data.gameStats?.find((g) => g.gameKey === game.type);
                        
                        if (scoreRow) {
                          return (
                            <div className="bg-card" key={game.type}>
                              <div className="bg-card__title">
                                <span>⚡ {game.name}</span>
                                <span style={{ color: '#10b981', fontSize: 12 }}>Played</span>
                              </div>
                              <div className="bg-card__grid">
                                <div className="bg-metric">
                                  <div className="bg-metric__val text-emerald-400">{scoreRow.accuracy}%</div>
                                  <div className="bg-metric__label">Accuracy</div>
                                </div>
                                <div className="bg-metric">
                                  <div className="bg-metric__val text-amber-400">{scoreRow.bestStreak}</div>
                                  <div className="bg-metric__label">Best Streak</div>
                                </div>
                                <div className="bg-metric">
                                  <div className="bg-metric__val text-sky-400">{scoreRow.totalCorrect}/{scoreRow.totalAttempted}</div>
                                  <div className="bg-metric__label">Correct</div>
                                </div>
                                <div className="bg-metric">
                                  <div className="bg-metric__val text-slate-400">
                                    {scoreRow.lastPlayedAt ? new Date(scoreRow.lastPlayedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : '—'}
                                  </div>
                                  <div className="bg-metric__label">Last Played</div>
                                </div>
                              </div>
                              <Link to={game.path} className="bg-btn bg-btn--primary">
                                Play Again →
                              </Link>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-card bg-card--locked" key={game.type}>
                              <div className="bg-card__title">
                                <span>🔒 {game.name}</span>
                                <span style={{ color: '#64748b', fontSize: 11 }}>Locked</span>
                              </div>
                              <div className="bg-card__grid">
                                <div className="bg-metric">
                                  <div className="bg-metric__val text-slate-500">—</div>
                                  <div className="bg-metric__label">Accuracy</div>
                                </div>
                                <div className="bg-metric">
                                  <div className="bg-metric__val text-slate-500">—</div>
                                  <div className="bg-metric__label">Streak</div>
                                </div>
                                <div className="bg-metric">
                                  <div className="bg-metric__val text-slate-500">—</div>
                                  <div className="bg-metric__label">Correct</div>
                                </div>
                                <div className="bg-metric">
                                  <div className="bg-metric__val text-slate-500">Not played</div>
                                  <div className="bg-metric__label">Status</div>
                                </div>
                              </div>
                              {game.active ? (
                                <Link to={game.path} className="bg-btn bg-btn--primary">
                                  Start Playing →
                                </Link>
                              ) : (
                                <button disabled className="bg-btn bg-btn--locked">
                                  Coming Soon
                                </button>
                              )}
                            </div>
                          );
                        }
                      })}
                    </div>
                  </section>

                  {/* 3. PROGRESS CHART & 5. RANK CARD (SIDE-BY-SIDE) */}
                  <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
                    {/* Chart Panel */}
                    <div className="xl:col-span-2 bg-panel" style={{ '--accent': '#38bdf8' }}>
                      <div className="bg-panel__edge" />
                      <div className="bg-panel__pad">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div>
                            <div className="bg-eyebrow" style={{ '--accent': '#38bdf8' }}>Trends</div>
                            <h2 className="bg-panel__title">Accuracy Progress</h2>
                          </div>
                          
                          <select
                            value={selectedGameType}
                            onChange={(e) => setSelectedGameType(e.target.value)}
                            className="bg-dropdown"
                          >
                            {GAMES.map(g => (
                              <option key={g.type} value={g.type}>{g.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Custom SVG Line Chart */}
                        <div className="mt-6" style={{ height: 220, position: 'relative' }}>
                          <AccuracyChart history={data.history} gameType={selectedGameType} />
                        </div>
                      </div>
                    </div>

                    {/* Rank Card */}
                    <div className="bg-panel" style={{ '--accent': '#a78bfa' }}>
                      <div className="bg-panel__edge" />
                      <div className="bg-panel__pad flex flex-col justify-between h-full" style={{ minHeight: 260 }}>
                        <div>
                          <div className="bg-eyebrow" style={{ '--accent': '#a78bfa' }}>Leaderboard</div>
                          <h2 className="bg-panel__title">Global Standing</h2>
                        </div>

                        <div className="bg-rank-card my-4">
                          <div>
                            <div className="text-xs text-slate-500 font-mono">RANK POSITION</div>
                            <div className="bg-rank-num mt-1">
                              {rankData?.rank > 0 ? `#${rankData.rank}` : '—'}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">out of</span>
                            <div className="text-base font-semibold text-slate-300 font-mono">
                              {rankData?.totalPlayers || 0} active
                            </div>
                          </div>
                        </div>

                        <Link to="/games/complexity/leaderboard" className="bg-btn bg-btn--primary">
                          View Leaderboard →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* 4. ACHIEVEMENTS / BADGES */}
                  <section className="bg-panel" style={{ '--accent': '#10b981' }}>
                    <div className="bg-panel__edge" />
                    <div className="bg-panel__pad">
                      <div className="bg-eyebrow" style={{ '--accent': '#10b981' }}>Milestones</div>
                      <h2 className="bg-panel__title">Unlocked Achievements</h2>
                      
                      <div className="bg-badge-grid mt-6">
                        {badges.map((badge) => (
                          <div
                            key={badge.id}
                            className={`bg-badge-card ${
                              badge.earned ? 'bg-badge-card--earned badge-shine' : 'bg-badge-card--locked'
                            }`}
                            style={badge.earned ? {} : { opacity: 0.4, filter: 'grayscale(1)', transform: 'scale(0.95)', transition: 'all 0.2s' }}
                          >
                            <span className="bg-badge-icon">{badge.icon}</span>
                            <div>
                              <div className="bg-badge-name" style={{ color: badge.earned ? badge.color : '' }}>
                                {badge.name}
                              </div>
                              <div className="bg-badge-desc">{badge.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* 6. RECENT ACTIVITY LIST */}
                  <section className="bg-panel" style={{ '--accent': '#f59e0b' }}>
                    <div className="bg-panel__edge" />
                    <div className="bg-panel__pad">
                      <div className="bg-eyebrow" style={{ '--accent': '#f59e0b' }}>Feed</div>
                      <h2 className="bg-panel__title">Recent Session Logs</h2>
                      
                      <div className="bg-table-wrap mt-6">
                        <table className="bg-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Game</th>
                              <th>Score</th>
                              <th>Accuracy</th>
                            </tr>
                          </thead>
                          <tbody>
                           {data.history?.slice(0, 10).map((h) => {
                              const gameLabel = h.gameName || h.gameKey;
                              return (
                                <tr key={h.id}>
                                  <td>{new Date(h.playedAt).toLocaleString()}</td>
                                  <td className="font-semibold text-slate-300">{gameLabel}</td>
                                  <td className="font-mono text-amber-400 font-bold">+{h.score} pts</td>
                                  <td>
                                    <span
                                      style={{
                                        color: h.accuracy >= 80 ? '#34d399' : h.accuracy >= 50 ? '#fbbf24' : '#f87171',
                                      }}
                                    >
                                      {h.accuracy}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Sub-component: Accuracy trend SVG line chart
function AccuracyChart({ history = [], gameType }) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const filtered = useMemo(() => {
    return history
      .filter((h) => h.gameKey === gameType)
      .slice(0, 20)
      .reverse(); // oldest to newest
  }, [history, gameType]);

  if (filtered.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500 font-mono border border-white/5 rounded-2xl bg-white/[0.01] p-4">
        No diagnostics recorded for this module.
      </div>
    );
  }

  // Dimension helpers
  const width = 500;
  const height = 200;
  const paddingX = 40;
  const paddingY = 20;

  const points = filtered.map((d, i) => {
    const x = paddingX + (i * (width - 2 * paddingX)) / Math.max(1, filtered.length - 1);
    const y = height - paddingY - (d.accuracy * (height - 2 * paddingY)) / 100;
    return { x, y, accuracy: d.accuracy, playedAt: d.playedAt };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Gradient path
  const gradPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid Y-Lines (0, 25, 50, 75, 100) */}
      {[0, 25, 50, 75, 100].map((level) => {
        const y = height - paddingY - (level * (height - 2 * paddingY)) / 100;
        return (
          <g key={level}>
            <line
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="4 4"
            />
            <text
              x={paddingX - 10}
              y={y + 4}
              fill="#475569"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="end"
            >
              {level}%
            </text>
          </g>
        );
      })}

      {/* Accuracy line and gradient fill */}
      {points.length > 0 && (
        <>
          <motion.path
            d={gradPath}
            fill="url(#chartGrad)"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={prefersReducedMotion ? {} : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        </>
      )}

      {/* Plot dots */}
      {points.map((p, i) => (
        <g key={i}>
          <motion.circle
            cx={p.x}
            cy={p.y}
            initial={prefersReducedMotion ? {} : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10, delay: prefersReducedMotion ? 0 : 0.6 + i * 0.05 }}
            r="4"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="2"
            style={{ transition: 'all 0.2s' }}
          />
          <title>{`Accuracy: ${p.accuracy}% on ${new Date(p.playedAt).toLocaleDateString()}`}</title>
        </g>
      ))}
    </svg>
  );
}
