import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { brainGymAPI } from '../api';

const GAME_TYPE = 'complexity_guess';

export default function BrainGymLeaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await brainGymAPI.getLeaderboard(GAME_TYPE, 20);
        setLeaders(data);
      } catch (err) {
        console.warn('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getMedal = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  const getInitials = (name) =>
    (name || '??')
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || '??';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600;700&display=swap');

        .lb-root, .lb-root * { box-sizing: border-box; }
        .lb-root { font-family: 'DM Sans', sans-serif; min-height: 80vh; position: relative; }

        .lb-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .lb-bg__grid {
          position: absolute; inset: -2px;
          background-image:
            linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 80%);
        }
        .lb-bg__glow { position: absolute; top: -120px; right: 15%; width: 360px; height: 360px; background: rgba(14,165,233,0.12); border-radius: 50%; filter: blur(80px); }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }

        .lb-header {
          text-align: center; margin-bottom: 36px;
          animation: fadeUp .55s ease both;
        }
        .lb-header__eyebrow {
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
          letter-spacing: .18em; text-transform: uppercase; color: #0ea5e9;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-bottom: 8px;
        }
        .lb-header__eyebrow::before, .lb-header__eyebrow::after {
          content: ''; width: 20px; height: 1px; background: #0ea5e9; opacity: .5;
        }
        .lb-header__title {
          font-family: 'Syne', sans-serif; font-size: 34px; font-weight: 800;
          color: #f1f5f9; letter-spacing: -.03em;
        }
        .lb-header__title b { color: #38bdf8; font-weight: 800; }
        .lb-header__sub { font-size: 14px; color: #64748b; margin-top: 6px; }

        .lb-panel {
          position: relative; overflow: hidden;
          background: rgba(10,10,25,0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          backdrop-filter: blur(16px);
          animation: fadeUp .55s ease .1s both;
        }
        .lb-panel__edge {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #0ea5e9, transparent);
          opacity: .75;
        }

        .lb-table { width: 100%; border-collapse: collapse; }
        .lb-table th {
          font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
          letter-spacing: .15em; text-transform: uppercase; color: #475569;
          padding: 14px 20px; text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .lb-table td { padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .lb-table tr { transition: background .25s; }
        .lb-table tr:hover { background: rgba(255,255,255,0.03); }
        .lb-table tr.lb-me { background: rgba(14,165,233,0.06); }
        .lb-table tr.lb-me:hover { background: rgba(14,165,233,0.1); }

        .lb-rank { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; text-align: center; min-width: 40px; }
        .lb-user { display: flex; align-items: center; gap: 12px; }
        .lb-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          display: grid; place-items: center;
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 13px; color: #f1f5f9;
          background: linear-gradient(140deg, rgba(14,165,233,0.8), rgba(16,185,129,0.7));
          flex-shrink: 0;
        }
        .lb-username { font-size: 14px; font-weight: 600; color: #f1f5f9; }
        .lb-you { font-size: 10px; font-weight: 700; color: #0ea5e9; margin-left: 6px; padding: 2px 6px; border-radius: 999px; background: rgba(14,165,233,0.12); border: 1px solid rgba(14,165,233,0.25); }
        .lb-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; }
        .lb-acc { color: #10b981; }
        .lb-streak { color: #f59e0b; }
        .lb-correct { color: #38bdf8; }

        .lb-skel { height: 54px; position: relative; overflow: hidden; }
        .lb-skel::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent); animation: shimmer 1.5s infinite; }

        .lb-empty { text-align: center; padding: 60px 24px; color: #64748b; }
        .lb-empty__icon { font-size: 40px; margin-bottom: 12px; }
        .lb-empty__t { font-size: 16px; font-weight: 600; color: #94a3b8; }

        .lb-back {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 24px; padding: 10px 22px; border-radius: 999px;
          font-size: 13px; font-weight: 700;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: #94a3b8; text-decoration: none; transition: all .3s;
        }
        .lb-back:hover { background: rgba(255,255,255,0.08); color: #f1f5f9; transform: translateY(-2px); }

        @media (max-width: 640px) {
          .lb-table th, .lb-table td { padding: 10px 12px; font-size: 11px; }
          .lb-header__title { font-size: 26px; }
        }
      `}</style>

      <div className="lb-root">
        <div className="lb-bg" aria-hidden>
          <div className="lb-bg__grid" />
          <div className="lb-bg__glow" />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-12" style={{ position: 'relative', zIndex: 1 }}>
          <div className="lb-header">
            <div className="lb-header__eyebrow">Brain Gym Leaderboard</div>
            <h1 className="lb-header__title">
              Complexity Quiz <b>Rankings</b>
            </h1>
            <p className="lb-header__sub">
              Top players ranked by accuracy (min 5 attempts required to qualify)
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="lb-panel"
          >
            <div className="lb-panel__edge" />

            {loading ? (
              <div style={{ padding: 20 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="lb-skel" />
                ))}
              </div>
            ) : leaders.length > 0 ? (
              <table className="lb-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>Rank</th>
                    <th>Player</th>
                    <th>Accuracy</th>
                    <th>Streak</th>
                    <th>Correct</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((entry, i) => (
                    <tr key={entry.userId} className={entry.isCurrentUser ? 'lb-me' : ''}>
                      <td className="lb-rank">{getMedal(i)}</td>
                      <td>
                        <div className="lb-user">
                          <div className="lb-avatar">
                            {getInitials(entry.displayName)}
                          </div>
                          <span className="lb-username">
                            {entry.username || entry.displayName}
                            {entry.isCurrentUser && <span className="lb-you">YOU</span>}
                          </span>
                        </div>
                      </td>
                      <td className="lb-val lb-acc">{entry.accuracy}%</td>
                      <td className="lb-val lb-streak">🔥 {entry.bestStreak}</td>
                      <td className="lb-val lb-correct">{entry.totalCorrect}/{entry.totalAttempted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="lb-empty">
                <div className="lb-empty__icon">📊</div>
                <div className="lb-empty__t">No qualified players yet</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Play at least 5 questions to appear on the leaderboard
                </div>
              </div>
            )}
          </motion.div>

          <div style={{ textAlign: 'center' }}>
            <Link to="/games/complexity" className="lb-back">
              ← Back to Brain Gym
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
