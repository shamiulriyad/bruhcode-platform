import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { roomAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function RoomSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await roomAPI.getSummary(id);
      setSummary(data);
    } catch (err) {
      toast.error('Failed to load summary');
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  if (loading || !summary) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: '#64748b', fontSize: 14 }}>Loading summary...</div>
      </div>
    );
  }

  const { room: roomData, leaderboard, problemStats, weakestProblem } = summary;
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <span style={{ fontSize: 48 }}>🏆</span>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: '8px 0 4px' }}>
          Session Complete
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          {roomData.name} — {roomData.contestName}
        </p>
      </motion.div>

      {/* Podium */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        gap: 12, marginBottom: 40, minHeight: 200,
      }}>
        {[1, 0, 2].map((podiumIndex) => {
          const entry = top3[podiumIndex];
          if (!entry) return null;
          const heights = [180, 140, 110];
          const colors = ['#fbbf24', '#94a3b8', '#c68a5b'];
          const medals = ['🥇', '🥈', '🥉'];

          return (
            <motion.div
              key={entry.userId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: heights[podiumIndex], opacity: 1 }}
              transition={{ delay: podiumIndex * 0.2 + 0.3, duration: 0.6, ease: 'easeOut' }}
              style={{
                width: 120, borderRadius: '12px 12px 0 0',
                background: `linear-gradient(180deg, ${colors[podiumIndex]}15, ${colors[podiumIndex]}08)`,
                border: `1px solid ${colors[podiumIndex]}30`,
                borderBottom: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'flex-start', padding: '16px 8px',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: 28, marginBottom: 6 }}>{medals[podiumIndex]}</span>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors[podiumIndex]}40, ${colors[podiumIndex]}20)`,
                border: `2px solid ${colors[podiumIndex]}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#0f172a',
                marginBottom: 6, overflow: 'hidden',
              }}>
                {entry.profilePic ? (
                  <img src={entry.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  entry.displayName?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: entry.userId === user?.id ? '#38bdf8' : '#e2e8f0',
                textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', maxWidth: '100%',
              }}>
                {entry.displayName}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: colors[podiumIndex], marginTop: 4 }}>
                {entry.solvedCount}
              </div>
              <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600, letterSpacing: '0.1em' }}>
                SOLVED
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full Leaderboard */}
      {rest.length > 0 && (
        <div style={{
          background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 16, marginBottom: 24,
        }}>
          {rest.map((entry) => (
            <div
              key={entry.userId}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#64748b',
                fontFamily: "'JetBrains Mono', monospace", width: 30,
              }}>
                #{entry.rank}
              </span>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#0f172a',
              }}>
                {entry.displayName?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                {entry.displayName}
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#34d399', fontFamily: "'JetBrains Mono', monospace" }}>
                {entry.solvedCount}
              </span>
              <span style={{ fontSize: 11, color: '#64748b' }}>solved</span>
            </div>
          ))}
        </div>
      )}

      {/* Problem Stats */}
      <div style={{
        background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: 20, marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 14px' }}>
          📊 Problem Breakdown
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {(problemStats || []).map((ps) => (
            <div
              key={ps.id}
              style={{
                padding: '14px', borderRadius: 10,
                background: ps === weakestProblem ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                border: ps === weakestProblem ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8' }}>{ps.problemIndex}</span>
                {ps === weakestProblem && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                    HARDEST
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{ps.problemName}</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>{ps.solveRate}%</div>
                  <div style={{ fontSize: 8, color: '#475569', fontWeight: 600 }}>SOLVE RATE</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>{ps.totalAttempts}</div>
                  <div style={{ fontSize: 8, color: '#475569', fontWeight: 600 }}>ATTEMPTS</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
        <button
          onClick={() => navigate('/rooms')}
          style={{
            padding: '12px 24px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e2e8f0', fontWeight: 600, fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ← Back to Rooms
        </button>
        <button
          onClick={() => {
            toast.success('Rematch setup — Create a new room with the same team!');
            navigate('/rooms');
          }}
          style={{
            padding: '12px 24px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
            color: '#0f172a', fontWeight: 700, fontSize: 13,
            cursor: 'pointer',
          }}
        >
          🔄 Rematch
        </button>
      </div>
    </div>
  );
}
