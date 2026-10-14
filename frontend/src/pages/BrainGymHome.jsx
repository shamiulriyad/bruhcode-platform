import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { brainGymAPI } from '../api';

/* Games that have a playable page. Anything else from the API is shown as "coming soon". */
const GAMES = {
  complexity_guess: {
    path: '/games/complexity',
    leaderboard: '/games/complexity/leaderboard',
    accent: '#7dd3fc',
    skill: 'Recognise time complexity at a glance',
  },
  debug_the_code: {
    path: '/games/debug',
    leaderboard: '/games/debug/leaderboard',
    accent: '#c4b5fd',
    skill: 'Spot the bug before the clock runs out',
  },
};

const ICONS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 13v4M8 20h8',
  play: 'M7 5v14l11-7L7 5Z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 12h.01',
  flame: 'M12 21c-3.9 0-7-2.8-7-6.5 0-3 2-5 3.5-6.5.2 1.7 1 3 2.5 3.5C11 8 12 5 15 3c0 3 4 5.5 4 11.5 0 3.7-3.1 6.5-7 6.5Z',
  layers: 'M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5',
  check: 'M5 13l4 4L19 7',
};

function Glyph({ name, className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

/* ─── Small previews that show what each game feels like ──────── */

function ComplexityPreview() {
  return (
    <div className="gm-preview" aria-hidden="true">
      <pre>{`for (int i = 1; i < n; i *= 2)
  for (int j = 0; j < n; j++)
    total += a[j];`}</pre>
      <div className="flex flex-wrap gap-1.5">
        {['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'].map((o) => (
          <span key={o} className={o === 'O(n log n)' ? 'gm-opt is-right' : 'gm-opt'}>{o}</span>
        ))}
      </div>
    </div>
  );
}

function DebugPreview() {
  return (
    <div className="gm-preview" aria-hidden="true">
      <pre>
        <span className="gm-line">{'int lo = 0, hi = n;'}</span>
        <span className="gm-line is-bug">{'while (lo <= hi) {'}</span>
        <span className="gm-line">{'  int mid = (lo + hi) / 2;'}</span>
      </pre>
      <div className="gm-bug-note">Line 2 — off-by-one: reads a[n]</div>
    </div>
  );
}

function LadderPreview() {
  return (
    <div className="gm-preview gm-ladder" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => <span key={i} style={{ width: `${40 + i * 18}%` }} />)}
    </div>
  );
}

const PREVIEWS = { complexity_guess: ComplexityPreview, debug_the_code: DebugPreview };

/* ─── Page ────────────────────────────────────────────────────── */

export default function BrainGymHome() {
  const [games, setGames] = useState(null);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    // Load independently so the game list still shows if stats fail (and vice versa)
    brainGymAPI.getGamesList()
      .then(({ data }) => setGames(Object.values(data).flat()))
      .catch(() => setGames([]));
    brainGymAPI.getOverview()
      .then(({ data }) => setOverview(data))
      .catch(() => setOverview({}));
  }, []);

  const totals = overview?.overallStats;
  const statsFor = (key) => overview?.gameStats?.find((s) => s.gameKey === key);
  const history = overview?.history || [];

  const playable = (games || []).filter((g) => GAMES[g.gameKey]);
  const upcoming = (games || []).filter((g) => !GAMES[g.gameKey]);
  // Suggest the game you haven't played yet, otherwise the one with the lowest accuracy
  const suggested = playable
    .map((g) => ({ key: g.gameKey, acc: statsFor(g.gameKey)?.accuracy ?? -1 }))
    .sort((a, b) => a.acc - b.acc)[0]?.key;

  return (
    <div className="gm-root">
      <style>{STYLES}</style>
      <div className="gm-glow" aria-hidden="true" />

      <div className="gm-wrap relative py-12 lg:py-16">
        {/* ── Header ─────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="gm-eyebrow">Brain Gym</p>
            <h1 className="gm-h1 mt-3">Train your contest instincts.</h1>
            <p className="gm-lead mt-3 max-w-xl">
              Short, timed rounds of 10 questions that sharpen the skills you lean on mid-contest. Every round updates your stats and the leaderboard.
            </p>
          </div>
          <Link to="/profile/brain-gym" className="gm-btn-ghost">
            <Glyph name="chart" /> Your full stats
          </Link>
        </div>

        {/* ── Stats ──────────────────────────────── */}
        <dl className="gm-stats mt-10">
          {[
            { icon: 'layers', label: 'Rounds played', value: totals?.totalGamesPlayed, tone: '#7dd3fc' },
            { icon: 'target', label: 'Overall accuracy', value: totals ? `${totals.overallAccuracy}%` : undefined, tone: '#6ee7b7' },
            { icon: 'flame', label: 'Best streak', value: totals?.bestStreak, tone: '#fcd34d' },
            { icon: 'check', label: 'Questions answered', value: totals?.totalAttempted, tone: '#c4b5fd' },
          ].map((s) => (
            <div key={s.label} className="gm-stat" style={{ '--tone': s.tone }}>
              <span className="gm-stat-icon"><Glyph name={s.icon} /></span>
              <dd className="gm-stat-value">{overview === null ? <span className="gm-skeleton-text" /> : (s.value ?? 0)}</dd>
              <dt className="gm-stat-label">{s.label}</dt>
            </div>
          ))}
        </dl>

        {/* ── Games ──────────────────────────────── */}
        <section className="mt-16">
          <h2 className="gm-h2 mb-5">Choose a game</h2>
          {games === null ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{[0, 1].map((i) => <div key={i} className="gm-skeleton" />)}</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {playable.map((game) => {
                const meta = GAMES[game.gameKey];
                const stats = statsFor(game.gameKey);
                const Preview = PREVIEWS[game.gameKey];
                return (
                  <article key={game.gameKey} className="gm-game" style={{ '--accent': meta.accent }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="gm-tag">{game.category}</span>
                      {game.gameKey === suggested && <span className="gm-tag is-suggested">{stats ? 'Needs practice' : 'Start here'}</span>}
                    </div>
                    <h3 className="gm-game-title">{game.name}</h3>
                    <p className="gm-body">{meta.skill}. {game.description}</p>

                    {Preview && <Preview />}

                    <div className="gm-game-stats">
                      {stats ? (
                        <>
                          <div><span>Accuracy</span><strong>{stats.accuracy}%</strong></div>
                          <div><span>Best streak</span><strong>{stats.bestStreak}</strong></div>
                          <div><span>Last played</span><strong>{timeAgo(stats.lastPlayedAt)}</strong></div>
                        </>
                      ) : (
                        <p className="gm-muted">You haven&apos;t played this yet — your first round takes about two minutes.</p>
                      )}
                    </div>

                    <div className="gm-game-actions">
                      <Link to={meta.path} className="gm-btn-primary">
                        <Glyph name="play" className="h-3.5 w-3.5" /> {stats ? 'Play again' : 'Play now'}
                      </Link>
                      <Link to={meta.leaderboard} className="gm-link">
                        <Glyph name="trophy" /> Leaderboard
                      </Link>
                    </div>
                  </article>
                );
              })}

              {upcoming.map((game) => (
                <article key={game.gameKey} className="gm-game is-soon">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="gm-tag">{game.category}</span>
                    <span className="gm-tag is-soon">Coming soon</span>
                  </div>
                  <h3 className="gm-game-title">{game.name}</h3>
                  <p className="gm-body">{game.description}</p>
                  <LadderPreview />
                  <p className="gm-muted mt-auto pt-6">We&apos;re still building this one. It will appear here when it&apos;s ready.</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Recent rounds ──────────────────────── */}
        {history.length > 0 && (
          <section className="mt-16">
            <h2 className="gm-h2 mb-5">Recent rounds</h2>
            <ul className="gm-history">
              {history.slice(0, 6).map((h) => (
                <li key={h.id}>
                  <span className="gm-history-dot" style={{ background: GAMES[h.gameKey]?.accent || '#94a3b8' }} />
                  <span className="min-w-0 flex-1 truncate text-slate-200">{h.gameName}</span>
                  <span className="gm-mono text-slate-300">{h.score} pts</span>
                  <span className="gm-mono w-14 text-right" style={{ color: h.accuracy >= 70 ? '#6ee7b7' : h.accuracy >= 40 ? '#fcd34d' : '#fca5a5' }}>
                    {Math.round(h.accuracy)}%
                  </span>
                  <span className="gm-history-time"><Glyph name="clock" className="h-3.5 w-3.5" /> {timeAgo(h.playedAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

.gm-root {
  --gm-line: rgba(255,255,255,0.07);
  --gm-line-strong: rgba(255,255,255,0.12);
  position: relative; overflow-x: clip; min-height: 100vh;
  background: #06070c; color: #cbd5e1;
  font-family: 'DM Sans', system-ui, sans-serif;
}
.gm-wrap { width: min(100% - 32px, 1240px); margin-inline: auto; }
.gm-glow {
  position: absolute; top: -220px; left: 25%; width: 960px; height: 540px; pointer-events: none;
  background: radial-gradient(closest-side, rgba(167,139,250,0.10), transparent),
              radial-gradient(closest-side at 80% 60%, rgba(56,189,248,0.08), transparent);
  filter: blur(30px);
}

.gm-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; }
.gm-h1 { font-weight: 700; color: #f8fafc; font-size: clamp(34px, 4.4vw, 52px); line-height: 1.06; letter-spacing: -0.035em; }
.gm-h2 { font-weight: 600; color: #f1f5f9; font-size: 20px; letter-spacing: -0.02em; }
.gm-lead { font-size: 17px; line-height: 1.6; color: #94a3b8; }
.gm-body { margin-top: 8px; font-size: 15px; line-height: 1.6; color: #94a3b8; }
.gm-muted { font-size: 14px; line-height: 1.6; color: #7c879b; }
.gm-mono { font-family: 'JetBrains Mono', monospace; font-size: 13px; }

.gm-btn-primary, .gm-btn-ghost {
  display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 999px;
  font-size: 14px; font-weight: 600; white-space: nowrap;
  transition: transform .2s ease, background .2s ease, border-color .2s ease;
}
.gm-btn-primary { color: #04121c; background: linear-gradient(100deg, #7dd3fc, #6ee7b7); box-shadow: 0 10px 30px -12px rgba(56,189,248,0.6), inset 0 1px 0 rgba(255,255,255,0.5); }
.gm-btn-primary:hover { transform: translateY(-1px); }
.gm-btn-ghost { color: #e2e8f0; border: 1px solid var(--gm-line-strong); background: rgba(255,255,255,0.02); }
.gm-btn-ghost:hover { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.05); }
.gm-link { display: inline-flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 500; color: #94a3b8; transition: color .2s ease; }
.gm-link:hover { color: #f1f5f9; }

/* stats */
.gm-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (min-width: 1024px) { .gm-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.gm-stat { padding: 18px 20px; border-radius: 18px; background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01)); border: 1px solid var(--gm-line); }
.gm-stat-icon { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; color: var(--tone); background: color-mix(in srgb, var(--tone) 12%, transparent); }
.gm-stat-value { margin-top: 16px; font-size: 32px; font-weight: 700; color: #f8fafc; letter-spacing: -0.03em; line-height: 1; min-height: 32px; }
.gm-stat-label { margin-top: 6px; font-size: 13px; color: #64748b; }
.gm-skeleton-text { display: inline-block; width: 56px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.06); }

/* game cards */
.gm-game {
  position: relative; display: flex; flex-direction: column; min-width: 0; padding: 26px; border-radius: 24px;
  background: radial-gradient(500px 220px at 100% 0%, color-mix(in srgb, var(--accent, #7dd3fc) 9%, transparent), transparent 70%),
              linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.012));
  border: 1px solid var(--gm-line);
  transition: border-color .25s ease, transform .25s ease;
}
.gm-game:not(.is-soon):hover { border-color: color-mix(in srgb, var(--accent) 40%, transparent); transform: translateY(-2px); }
.gm-game.is-soon { opacity: 0.75; }
.gm-tag { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; color: #94a3b8; background: rgba(255,255,255,0.05); }
.gm-tag.is-suggested { color: #fde68a; background: rgba(252,211,77,0.12); }
.gm-tag.is-soon { color: #c4b5fd; background: rgba(167,139,250,0.12); }
.gm-game-title { margin-top: 16px; font-weight: 600; font-size: 22px; color: #f8fafc; letter-spacing: -0.02em; }

.gm-preview { margin-top: 20px; padding: 16px 18px; border-radius: 16px; background: rgba(6,7,12,0.75); border: 1px solid var(--gm-line); }
.gm-preview pre { margin: 0 0 14px; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.75; color: #a5b4fc; white-space: pre; overflow-x: auto; }
.gm-line { display: block; padding: 0 6px; margin: 0 -6px; border-radius: 6px; }
.gm-line.is-bug { color: #fecaca; background: rgba(248,113,113,0.12); }
.gm-bug-note { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #fca5a5; }
.gm-opt { font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 6px 10px; border-radius: 9px; border: 1px solid var(--gm-line-strong); color: #94a3b8; }
.gm-opt.is-right { color: #6ee7b7; border-color: rgba(52,211,153,0.45); background: rgba(52,211,153,0.08); }
.gm-ladder { display: grid; gap: 8px; }
.gm-ladder span { display: block; height: 10px; border-radius: 99px; background: linear-gradient(90deg, rgba(196,181,253,0.35), rgba(196,181,253,0.08)); }

.gm-game-stats { margin-top: 20px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding-top: 18px; border-top: 1px solid var(--gm-line); }
.gm-game-stats > p { grid-column: 1 / -1; }
.gm-game-stats span { display: block; font-size: 12px; color: #64748b; }
.gm-game-stats strong { display: block; margin-top: 3px; font-size: 16px; font-weight: 600; color: #f1f5f9; }
.gm-game-actions { margin-top: auto; padding-top: 22px; display: flex; flex-wrap: wrap; align-items: center; gap: 18px; }

.gm-skeleton { height: 420px; border-radius: 24px; background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.05), rgba(255,255,255,0.02)); background-size: 200% 100%; animation: gm-shimmer 1.4s linear infinite; }
@keyframes gm-shimmer { to { background-position: -200% 0; } }

/* history */
.gm-history { display: grid; grid-template-columns: minmax(0, 1fr); border-radius: 20px; border: 1px solid var(--gm-line); background: rgba(255,255,255,0.015); overflow: hidden; }
.gm-history li { display: flex; align-items: center; gap: 16px; padding: 14px 20px; font-size: 14px; }
.gm-history li + li { border-top: 1px solid var(--gm-line); }
.gm-history-dot { width: 8px; height: 8px; border-radius: 99px; flex-shrink: 0; }
.gm-history-time { display: inline-flex; align-items: center; gap: 6px; min-width: 110px; justify-content: flex-end; font-size: 13px; color: #64748b; }

@media (max-width: 640px) {
  .gm-game { padding: 20px; }
  .gm-history li { flex-wrap: wrap; gap: 6px 14px; }
  .gm-history li > .flex-1 { flex-basis: calc(100% - 24px); }
  .gm-history-time { min-width: 0; margin-left: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .gm-skeleton { animation: none; }
  .gm-game, .gm-btn-primary { transition: none; }
}
`;
