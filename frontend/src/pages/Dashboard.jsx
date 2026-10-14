import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ContestCard from '../components/ContestCard';
import { userAPI } from '../api';
import { useAuth } from '../context/AuthContext';

/* ─── Platform config ─────────────────────────────────────────── */
const PLATFORM_META = {
  Codeforces: { color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)',  border: 'rgba(255,77,77,0.2)',  abbr: 'CF' },
  LeetCode:   { color: '#FFA116', bg: 'rgba(255,161,22,0.1)', border: 'rgba(255,161,22,0.2)', abbr: 'LC' },
  AtCoder:    { color: '#00C896', bg: 'rgba(0,200,150,0.1)',  border: 'rgba(0,200,150,0.2)',  abbr: 'AC' },
  CodeChef:   { color: '#A0855B', bg: 'rgba(160,133,91,0.1)', border: 'rgba(160,133,91,0.2)', abbr: 'CC' },
  GeeksforGeeks: { color: '#0F9D58', bg: 'rgba(15,157,88,0.1)',  border: 'rgba(15,157,88,0.2)',  abbr: 'GFG' },
};
const DEFAULT_META = { color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.2)', abbr: '??' };

/* ─── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, accent, delay = 0 }) {
  return (
    <div
      style={{
        position: 'relative',
        background: 'rgba(10,10,25,0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: '20px 22px',
        overflow: 'hidden',
        backdropFilter: 'blur(16px)',
        animation: `fadeUp 0.5s ease ${delay}s both`,
      }}
    >
      {/* accent top-edge glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        opacity: 0.7,
      }} />
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#475569', fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.04em', fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{value}</div>
    </div>
  );
}

/* ─── Platform bar ────────────────────────────────────────────── */
function PlatformBar({ platform, count, total }) {
  const meta = PLATFORM_META[platform] || DEFAULT_META;
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: meta.color,
            boxShadow: `0 0 6px ${meta.color}99`,
            display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{platform}</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: meta.color, fontWeight: 700 }}>
          {count} <span style={{ color: '#334155', fontWeight: 400 }}>/ {pct}%</span>
        </span>
      </div>
      {/* progress track */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${meta.color}99, ${meta.color})`,
          borderRadius: 10,
          transition: 'width 0.8s cubic-bezier(.22,1,.36,1)',
        }} />
      </div>
    </div>
  );
}

/* ─── Quick note item ─────────────────────────────────────────── */
function NoteItem({ icon, text, delay }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 14px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 14,
      animation: `fadeUp 0.4s ease ${delay}s both`,
    }}>
      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const [savedContests, setSavedContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = viewportWidth < 900;

  const loadSavedContests = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getSavedContests();
      const contests = response.data
        .map((item) => ({ ...(item.contest || {}), savedContestId: item.id, status: item.status }))
        .filter((c) => c.id);
      setSavedContests(contests);
    } catch (err) {
      toast.error(err?.response?.data || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSavedContests(); }, []);

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

  const removeContest = async (contestId) => {
    try {
      await userAPI.removeContest(contestId);
      toast.success('Removed from dashboard');
      await loadSavedContests();
    } catch (err) {
      toast.error(err?.response?.data || 'Could not remove contest');
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'coder';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600;700&display=swap');

        .db-root { box-sizing: border-box; }
        .db-root * { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes shimmer {
          from { background-position: -200% center; }
          to   { background-position: 200% center; }
        }

        .db-hero-card {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          padding: 40px;
          background: linear-gradient(135deg, #07071a 0%, #0c0c22 60%, #07071a 100%);
          border: 1px solid rgba(255,255,255,0.07);
          animation: fadeUp 0.5s ease 0.05s both;
        }
        .db-hero-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 70% 0%, rgba(99,102,241,0.12) 0%, transparent 60%),
                      radial-gradient(ellipse at 10% 100%, rgba(20,184,166,0.07) 0%, transparent 50%);
          pointer-events: none;
        }

        .db-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #6366f1;
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.18);
          padding: 5px 14px 5px 10px;
          border-radius: 100px;
          margin-bottom: 18px;
        }
        .db-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #6366f1;
          position: relative;
        }
        .db-eyebrow-dot::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #6366f1;
          animation: pulseRing 2s infinite;
        }

        .db-greeting {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.04em;
          line-height: 1.05;
          margin: 0 0 12px;
        }
        .db-greeting-name {
          background: linear-gradient(90deg, #818cf8, #34d399, #818cf8);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .db-hero-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #475569;
          line-height: 1.7;
          max-width: 480px;
          margin: 0;
        }

        .db-explore-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #10b981;
          color: #022c22;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          padding: 11px 22px;
          border-radius: 100px;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          letter-spacing: 0.01em;
        }
        .db-explore-btn:hover {
          background: #34d399;
          transform: translateY(-1px);
        }
        .db-explore-btn::after { content: '→'; }

        .db-section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #334155;
          margin-bottom: 4px;
        }
        .db-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .db-section-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #475569;
          margin: 2px 0 0;
        }

        .db-empty {
          font-family: 'DM Sans', sans-serif;
          padding: 40px 24px;
          text-align: center;
          color: #334155;
          background: rgba(10,10,25,0.5);
          border: 1px dashed rgba(255,255,255,0.06);
          border-radius: 20px;
          font-size: 14px;
          line-height: 1.7;
        }

        .db-panel {
          background: rgba(10,10,25,0.7);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 22px;
          padding: 24px;
          backdrop-filter: blur(16px);
        }

        .db-contest-row {
          background: rgba(10,10,25,0.5);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px;
          padding: 2px;
          transition: border-color 0.2s;
        }
        .db-contest-row:hover { border-color: rgba(99,102,241,0.2); }

        .db-divider {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.05);
          margin: 0;
        }
      `}</style>

      <div className="db-root" style={{
        fontFamily: "'DM Sans', sans-serif",
        minHeight: '100vh',
        background: '#060612',
        padding: 'clamp(12px, 3.5vw, 2rem)',
        position: 'relative',
      }}>

        {/* ── Hero card ── */}
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="db-hero-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="db-eyebrow">
                  <span className="db-eyebrow-dot" />
                  Dashboard
                </div>
                <h1 className="db-greeting">
                  Welcome back,{' '}
                  <span className="db-greeting-name">{displayName}</span>.
                </h1>
                <p className="db-hero-sub">
                  Track saved contests, see what's live, and keep your competitive schedule in one place.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <Link to="/" className="db-explore-btn">Explore contests</Link>

                {/* live pill */}
                {stats.live > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,77,77,0.08)',
                    border: '1px solid rgba(255,77,77,0.2)',
                    borderRadius: 100, padding: '6px 14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11, fontWeight: 700, color: '#FF4D4D',
                    letterSpacing: '0.1em',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4D4D', animation: 'pulseRing 1.5s infinite', display: 'inline-block' }} />
                    {stats.live} LIVE NOW
                  </div>
                )}
              </div>
            </div>

            {/* ── Stat row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 32, position: 'relative', zIndex: 1 }}>
              <StatCard label="Saved contests" value={stats.saved}    accent="#818cf8" delay={0.15} />
              <StatCard label="Live now"        value={stats.live}     accent="#FF4D4D" delay={0.20} />
              <StatCard label="Upcoming"        value={stats.upcoming} accent="#00C896" delay={0.25} />
              <StatCard label="Platforms"       value={stats.platforms} accent="#FFA116" delay={0.30} />
            </div>
          </div>

          {/* ── Saved contests section ── */}
          <section style={{ marginTop: 28, animation: 'fadeUp 0.5s ease 0.35s both' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="db-section-label">Bookmarked</div>
                <h2 className="db-section-title">Your saved contests</h2>
                <p className="db-section-sub">Contests you marked as interested or participating.</p>
              </div>
              {savedContests.length > 0 && (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, color: '#6366f1',
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  padding: '4px 12px', borderRadius: 100,
                }}>
                  {savedContests.length} total
                </span>
              )}
            </div>

            {loading ? (
              <div className="db-empty" style={{ color: '#475569' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.15em', fontFamily: "'JetBrains Mono', monospace", color: '#334155' }}>LOADING</div>
                <div style={{ marginTop: 6 }}>Fetching your saved contests…</div>
              </div>
            ) : savedContests.length === 0 ? (
              <div className="db-empty">
                <div style={{ fontSize: 28, marginBottom: 10 }}>📌</div>
                No saved contests yet.<br />
                <span style={{ color: '#6366f1' }}>Explore contests</span> and bookmark one to get started.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: 10,
                gridTemplateColumns: isMobile
                  ? 'minmax(0, 1fr)'
                  : 'repeat(auto-fill, minmax(320px, 1fr))',
              }}>
                {savedContests.map((contest, i) => (
                  <div
                    key={`${contest.id}-${contest.savedContestId}`}
                    className="db-contest-row"
                    style={{ animation: `fadeUp 0.4s ease ${0.05 * i}s both` }}
                  >
                    <ContestCard
                      contest={contest}
                      actionLabel="Remove"
                      actionTone="danger"
                      onBookmark={removeContest}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Bottom panels ── */}
          <section style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: isMobile ? '1fr' : '1.4fr 0.6fr',
            marginTop: 24,
            animation: 'fadeUp 0.5s ease 0.45s both',
          }}>

            {/* Quick notes */}
            <div className="db-panel">
              <div className="db-section-label" style={{ marginBottom: 14 }}>Tips</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <NoteItem delay={0.5} icon="🗓" text="Use the calendar view to spot days with overlapping contests before registering." />
                <NoteItem delay={0.55} icon="🔖" text="Bookmark contests you want to revisit — they appear here instantly." />
                <NoteItem delay={0.60} icon="⚡" text="Keep an eye on live contests and use the countdown to stay prepared." />
                <NoteItem delay={0.65} icon="📊" text="Track your platform mix below to balance your practice across sites." />
              </div>
            </div>

            {/* Platform mix */}
            <div className="db-panel">
              <div className="db-section-label" style={{ marginBottom: 14 }}>Breakdown</div>
              <div className="db-section-title" style={{ fontSize: '1rem', marginBottom: 16 }}>Platform mix</div>

              {savedContests.length === 0 ? (
                <div style={{ color: '#334155', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>No platform data yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Object.entries(platformCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([platform, count]) => (
                      <PlatformBar
                        key={platform}
                        platform={platform}
                        count={count}
                        total={savedContests.length}
                      />
                    ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}