import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Animated leaderboard panel.
 * Uses Framer Motion `layout` prop for smooth rank-change animations.
 */
export default function LeaderboardPanel({ leaderboard = [], currentUserId }) {
  return (
    <div className="leaderboard-panel">
      <style>{`
        .leaderboard-panel {
          background: linear-gradient(180deg, rgba(15,23,42,0.7), rgba(15,23,42,0.5));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 16px;
          backdrop-filter: blur(12px);
        }
        .lb-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .lb-header h3 {
          font-size: 14px;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: 0.04em;
          margin: 0;
        }
        .lb-badge {
          font-size: 10px;
          font-weight: 700;
          color: #38bdf8;
          background: rgba(56,189,248,0.1);
          border: 1px solid rgba(56,189,248,0.2);
          border-radius: 4px;
          padding: 2px 6px;
        }
        @media (prefers-reduced-motion: reduce) {
          .lb-row { transition: none !important; }
        }
      `}</style>

      <div className="lb-header">
        <span style={{ fontSize: 16 }}>🏆</span>
        <h3>Leaderboard</h3>
        <span className="lb-badge">{leaderboard.length} members</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <AnimatePresence>
          {leaderboard.map((entry) => (
            <motion.div
              key={entry.userId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }}
              className="lb-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 10,
                background:
                  entry.userId === currentUserId
                    ? 'rgba(56,189,248,0.08)'
                    : 'rgba(255,255,255,0.02)',
                border:
                  entry.userId === currentUserId
                    ? '1px solid rgba(56,189,248,0.2)'
                    : '1px solid transparent',
                transition: 'background 0.2s, border-color 0.2s',
              }}
            >
              {/* Rank */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  color:
                    entry.rank === 1
                      ? '#fbbf24'
                      : entry.rank === 2
                      ? '#94a3b8'
                      : entry.rank === 3
                      ? '#c68a5b'
                      : '#64748b',
                  background:
                    entry.rank === 1
                      ? 'rgba(251,191,36,0.12)'
                      : entry.rank === 2
                      ? 'rgba(148,163,184,0.1)'
                      : entry.rank === 3
                      ? 'rgba(198,138,91,0.1)'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    entry.rank === 1
                      ? 'rgba(251,191,36,0.2)'
                      : entry.rank === 2
                      ? 'rgba(148,163,184,0.15)'
                      : entry.rank === 3
                      ? 'rgba(198,138,91,0.15)'
                      : 'rgba(255,255,255,0.06)'
                  }`,
                }}
              >
                {entry.rank <= 3
                  ? ['🥇', '🥈', '🥉'][entry.rank - 1]
                  : `#${entry.rank}`}
              </div>

              {/* Avatar */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0f172a',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {entry.profilePic ? (
                  <img
                    src={entry.profilePic}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  entry.displayName?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: entry.userId === currentUserId ? '#38bdf8' : '#e2e8f0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.displayName}
                  {entry.userId === currentUserId && (
                    <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>(you)</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#34d399',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {entry.solvedCount}
                  </div>
                  <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600, letterSpacing: '0.1em' }}>
                    SOLVED
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#94a3b8',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {formatTimeSec(entry.totalTimeSec)}
                  </div>
                  <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600, letterSpacing: '0.1em' }}>
                    TIME
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function formatTimeSec(sec) {
  if (!sec) return '--';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
