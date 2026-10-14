import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { brainGymAPI } from '../api';

const GAMES = [
  { key: 'complexity_guess', title: 'Complexity Quiz', play: '/games/complexity', board: '/games/complexity/leaderboard' },
  { key: 'debug_the_code', title: 'Debug the Code', play: '/games/debug', board: '/games/debug/leaderboard' },
];

const MEDALS = ['#fcd34d', '#cbd5e1', '#f0a875'];
const MIN_QUESTIONS = 20; // matches GameController.MinQuestionsToRank

const ICONS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  play: 'M7 5v14l11-7L7 5Z',
  flame: 'M12 21c-3.9 0-7-2.8-7-6.5 0-3 2-5 3.5-6.5.2 1.7 1 3 2.5 3.5C11 8 12 5 15 3c0 3 4 5.5 4 11.5 0 3.7-3.1 6.5-7 6.5Z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 13v4M8 20h8',
};

function Glyph({ name, className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

const initialsOf = (name) =>
  (name || '?').split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

function Avatar({ entry, size = 40 }) {
  return (
    <span className="lb-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {entry.profilePictureUrl ? <img src={entry.profilePictureUrl} alt="" /> : initialsOf(entry.displayName)}
    </span>
  );
}

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function BrainGymLeaderboard({ gameKey = 'complexity_guess' }) {
  const game = GAMES.find((g) => g.key === gameKey) || GAMES[0];
  const [leaders, setLeaders] = useState(null);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    setLeaders(null);
    setMyRank(null);
    brainGymAPI.getLeaderboard(game.key, 50).then(({ data }) => setLeaders(data)).catch(() => setLeaders([]));
    brainGymAPI.getMyRank(game.key).then(({ data }) => setMyRank(data)).catch(() => setMyRank(null));
  }, [game.key]);

  const me = leaders?.find((l) => l.isCurrentUser);
  const podium = (leaders || []).slice(0, 3);
  const rest = (leaders || []).slice(3);

  return (
    <div className="lb-root">
      <style>{STYLES}</style>
      <div className="lb-glow" aria-hidden="true" />

      <div className="lb-wrap relative py-12 lg:py-16">
        <Link to="/games" className="lb-back"><Glyph name="back" /> Brain Gym</Link>

        {/* ── Header ─────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="lb-eyebrow">Leaderboard</p>
            <h1 className="lb-h1 mt-3">{game.title}</h1>
            <p className="lb-lead mt-3 max-w-xl">Ranked by accuracy. Answer {MIN_QUESTIONS} questions (two rounds) to qualify — ties go to more correct answers, then the best streak.</p>
          </div>
          <Link to={game.play} className="lb-btn-primary"><Glyph name="play" className="h-3.5 w-3.5" /> Play a round</Link>
        </div>

        <nav className="lb-tabs mt-8" aria-label="Choose game">
          {GAMES.map((g) => (
            <Link key={g.key} to={g.board} className={g.key === game.key ? 'lb-tab is-active' : 'lb-tab'} aria-current={g.key === game.key ? 'page' : undefined}>
              {g.title}
            </Link>
          ))}
        </nav>

        {/* ── Your standing ──────────────────────── */}
        <section className="lb-standing mt-6" aria-label="Your standing">
          {myRank === null || leaders === null ? (
            <div className="lb-skeleton h-[72px]" />
          ) : myRank.rank === '-' ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="lb-standing-label">Your standing</div>
                <p className="mt-1 text-slate-300">
                  {myRank.questionsAnswered > 0
                    ? `Answer ${myRank.questionsNeeded} more question${myRank.questionsNeeded === 1 ? '' : 's'} to get ranked.`
                    : `Not ranked yet — answer ${myRank.minQuestions ?? MIN_QUESTIONS} questions to join the board.`}
                </p>
                <div className="lb-progress mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={myRank.minQuestions ?? MIN_QUESTIONS} aria-valuenow={myRank.questionsAnswered ?? 0}>
                  <span style={{ width: `${Math.min(100, ((myRank.questionsAnswered ?? 0) / (myRank.minQuestions ?? MIN_QUESTIONS)) * 100)}%` }} />
                </div>
                <div className="mt-1.5 text-xs text-slate-500">{myRank.questionsAnswered ?? 0} / {myRank.minQuestions ?? MIN_QUESTIONS} questions</div>
              </div>
              <Link to={game.play} className="lb-btn-primary"><Glyph name="play" className="h-3.5 w-3.5" /> Play now</Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
              <div>
                <div className="lb-standing-label">Your standing</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="lb-standing-rank">#{myRank.rank}</span>
                  <span className="text-slate-500">of {myRank.totalPlayers}</span>
                </div>
              </div>
              {me && (
                <dl className="lb-standing-stats">
                  <div><dt>Accuracy</dt><dd>{me.accuracy}%</dd></div>
                  <div><dt>Correct</dt><dd>{me.totalCorrect}/{me.totalAttempted}</dd></div>
                  <div><dt>Best streak</dt><dd>{me.bestStreak}</dd></div>
                </dl>
              )}
            </div>
          )}
        </section>

        {/* ── Rankings ───────────────────────────── */}
        {leaders === null ? (
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="lb-skeleton h-[220px]" />)}</div>
        ) : leaders.length === 0 ? (
          <div className="lb-empty mt-10">
            <span className="lb-empty-icon"><Glyph name="trophy" className="h-6 w-6" /></span>
            <h2 className="lb-h2 mt-4">No one is ranked yet</h2>
            <p className="mt-2 text-slate-400">Answer {MIN_QUESTIONS} questions to qualify and take the top spot.</p>
            <Link to={game.play} className="lb-btn-primary mt-6"><Glyph name="play" className="h-3.5 w-3.5" /> Play {game.title}</Link>
          </div>
        ) : (
          <>
            <ol className="lb-podium mt-10" aria-label="Top three">
              {podium.map((entry, i) => (
                <li key={entry.userId} className={`lb-podium-item place-${i + 1}${entry.isCurrentUser ? ' is-me' : ''}`} style={{ '--medal': MEDALS[i] }}>
                  <span className="lb-medal">{i + 1}</span>
                  <Avatar entry={entry} size={i === 0 ? 64 : 52} />
                  <span className="lb-podium-name">{entry.displayName}{entry.isCurrentUser && <span className="lb-you">You</span>}</span>
                  <span className="lb-podium-handle">@{entry.username}</span>
                  <span className="lb-podium-score">{entry.accuracy}%<small> accuracy</small></span>
                  <span className="lb-podium-meta">{entry.totalCorrect}/{entry.totalAttempted} · <Glyph name="flame" className="inline h-3.5 w-3.5 align-[-2px]" /> {entry.bestStreak}</span>
                </li>
              ))}
            </ol>

            {rest.length > 0 && (
              <div className="lb-table-wrap mt-8">
                <table className="lb-table">
                  <thead>
                    <tr>
                      <th scope="col" className="w-16">Rank</th>
                      <th scope="col">Player</th>
                      <th scope="col">Accuracy</th>
                      <th scope="col" className="lb-hide-sm text-right">Correct</th>
                      <th scope="col" className="text-right">Streak</th>
                      <th scope="col" className="lb-hide-sm text-right">Last played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((entry, i) => (
                      <tr key={entry.userId} className={entry.isCurrentUser ? 'is-me' : undefined}>
                        <td className="lb-mono text-slate-500">{i + 4}</td>
                        <td>
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar entry={entry} size={34} />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-slate-100">
                                {entry.displayName}{entry.isCurrentUser && <span className="lb-you">You</span>}
                              </span>
                              <span className="block truncate text-xs text-slate-500">@{entry.username}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <span className="lb-bar lb-hide-sm"><span style={{ width: `${entry.accuracy}%` }} /></span>
                            <span className="lb-mono text-slate-100">{entry.accuracy}%</span>
                          </div>
                        </td>
                        <td className="lb-mono lb-hide-sm text-right text-slate-300">{entry.totalCorrect}<span className="text-slate-600">/{entry.totalAttempted}</span></td>
                        <td className="lb-mono text-right text-amber-200">{entry.bestStreak}</td>
                        <td className="lb-hide-sm text-right text-sm text-slate-500">{timeAgo(entry.lastPlayedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

.lb-root {
  --lb-line: rgba(255,255,255,0.07);
  --lb-line-strong: rgba(255,255,255,0.12);
  position: relative; overflow-x: clip; min-height: 100vh;
  background: #06070c; color: #cbd5e1;
  font-family: 'DM Sans', system-ui, sans-serif;
}
.lb-wrap { width: min(100% - 32px, 1000px); margin-inline: auto; }
.lb-glow {
  position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 900px; height: 520px; pointer-events: none;
  background: radial-gradient(closest-side, rgba(252,211,77,0.08), transparent),
              radial-gradient(closest-side at 70% 60%, rgba(56,189,248,0.08), transparent);
  filter: blur(30px);
}

.lb-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; }
.lb-h1 { font-weight: 700; color: #f8fafc; font-size: clamp(34px, 4.4vw, 50px); line-height: 1.06; letter-spacing: -0.035em; }
.lb-h2 { font-weight: 600; color: #f1f5f9; font-size: 20px; letter-spacing: -0.02em; }
.lb-lead { font-size: 17px; line-height: 1.6; color: #94a3b8; }
.lb-mono { font-family: 'JetBrains Mono', monospace; font-size: 13.5px; }

.lb-back { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: #94a3b8; transition: color .2s ease, gap .2s ease; }
.lb-back:hover { color: #f1f5f9; gap: 10px; }
.lb-btn-primary {
  display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 999px; white-space: nowrap;
  font-size: 14px; font-weight: 600; color: #04121c; background: linear-gradient(100deg, #7dd3fc, #6ee7b7);
  box-shadow: 0 10px 30px -12px rgba(56,189,248,0.6), inset 0 1px 0 rgba(255,255,255,0.5); transition: transform .2s ease;
}
.lb-btn-primary:hover { transform: translateY(-1px); }
.lb-link { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: #7dd3fc; }
.lb-link:hover { color: #bae6fd; }

.lb-tabs { display: flex; gap: 4px; width: fit-content; max-width: 100%; padding: 4px; border-radius: 14px; overflow-x: auto; scrollbar-width: none; background: rgba(255,255,255,0.025); border: 1px solid var(--lb-line); }
.lb-tab { white-space: nowrap; padding: 8px 14px; border-radius: 10px; font-size: 14px; font-weight: 500; color: #94a3b8; transition: color .2s ease, background .2s ease; }
.lb-tab:hover { color: #f1f5f9; }
.lb-tab.is-active { color: #f0f9ff; background: rgba(56,189,248,0.14); box-shadow: inset 0 0 0 1px rgba(56,189,248,0.25); }

.lb-standing { padding: 20px 24px; border-radius: 20px; background: linear-gradient(180deg, rgba(56,189,248,0.07), rgba(56,189,248,0.02)); border: 1px solid rgba(56,189,248,0.18); }
.lb-standing-label { font-size: 13px; color: #7dd3fc; }
.lb-standing-rank { font-size: 34px; font-weight: 700; color: #f8fafc; letter-spacing: -0.03em; line-height: 1; }
.lb-standing-stats { display: flex; flex-wrap: wrap; gap: 28px; }
.lb-standing-stats dt { font-size: 12px; color: #64748b; }
.lb-standing-stats dd { margin-top: 2px; font-size: 18px; font-weight: 600; color: #f1f5f9; }

/* podium */
.lb-podium { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; align-items: end; }
.lb-podium-item {
  position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 0;
  padding: 26px 16px 22px; border-radius: 22px;
  background: radial-gradient(260px 140px at 50% 0%, color-mix(in srgb, var(--medal) 14%, transparent), transparent 75%),
              linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.012));
  border: 1px solid color-mix(in srgb, var(--medal) 28%, transparent);
}
.lb-podium-item.place-1 { order: 2; padding-top: 34px; padding-bottom: 30px; box-shadow: 0 40px 100px -50px color-mix(in srgb, var(--medal) 70%, transparent); }
.lb-podium-item.place-2 { order: 1; }
.lb-podium-item.place-3 { order: 3; }
.lb-podium-item.is-me { outline: 2px solid rgba(56,189,248,0.5); outline-offset: 2px; }
.lb-medal {
  position: absolute; top: 12px; left: 12px; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 99px;
  font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500; color: #0b0d14; background: var(--medal);
}
.lb-podium-name { margin-top: 14px; max-width: 100%; font-weight: 600; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lb-podium-handle { max-width: 100%; font-size: 13px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lb-podium-score { margin-top: 14px; font-size: 26px; font-weight: 700; color: var(--medal); letter-spacing: -0.02em; line-height: 1; }
.lb-podium-score small { font-size: 13px; font-weight: 500; color: #94a3b8; letter-spacing: 0; }
.lb-podium-meta { margin-top: 8px; font-size: 13px; color: #94a3b8; }

.lb-avatar {
  flex-shrink: 0; display: grid; place-items: center; overflow: hidden; border-radius: 99px;
  font-weight: 700; color: #04121c; background: linear-gradient(135deg, #7dd3fc, #6ee7b7);
}
.lb-avatar img { width: 100%; height: 100%; object-fit: cover; }
.lb-you { margin-left: 8px; padding: 2px 7px; border-radius: 999px; font-size: 11px; font-weight: 600; color: #7dd3fc; background: rgba(56,189,248,0.12); vertical-align: 2px; }

/* table */
.lb-table-wrap { border-radius: 20px; border: 1px solid var(--lb-line); background: rgba(255,255,255,0.015); overflow-x: auto; }
.lb-table { width: 100%; border-collapse: collapse; table-layout: auto; }
.lb-table th { padding: 12px 18px; font-size: 12px; font-weight: 500; color: #64748b; text-align: left; border-bottom: 1px solid var(--lb-line); background: rgba(255,255,255,0.02); }
.lb-table th.text-right { text-align: right; }
.lb-table td { padding: 12px 18px; border-top: 1px solid var(--lb-line); vertical-align: middle; }
.lb-table tbody tr:first-child td { border-top: 0; }
.lb-table tbody tr:hover { background: rgba(255,255,255,0.02); }
.lb-table tr.is-me { background: rgba(56,189,248,0.07); }
.lb-table td:nth-child(2) { max-width: 260px; }
.lb-progress { height: 6px; max-width: 360px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
.lb-progress span { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #7dd3fc, #6ee7b7); }
.lb-bar { display: block; width: 90px; height: 6px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
.lb-bar span { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #7dd3fc, #6ee7b7); }

.lb-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 56px 24px; border-radius: 22px; border: 1px dashed rgba(255,255,255,0.12); }
.lb-empty-icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; color: #fcd34d; background: rgba(252,211,77,0.1); }
.lb-skeleton { border-radius: 20px; background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.05), rgba(255,255,255,0.02)); background-size: 200% 100%; animation: lb-shimmer 1.4s linear infinite; }
@keyframes lb-shimmer { to { background-position: -200% 0; } }

@media (max-width: 640px) {
  .lb-hide-sm { display: none; }
  .lb-table { table-layout: fixed; }
  .lb-table th, .lb-table td { padding: 10px 12px; }
  .lb-table th:nth-child(1) { width: 44px; }
  .lb-table th:nth-child(3) { width: 78px; }
  .lb-table th:nth-child(5) { width: 64px; }
  .lb-table td:nth-child(2) { max-width: none; overflow: hidden; }
  .lb-podium { gap: 8px; }
  .lb-podium-item { padding: 22px 8px 16px; border-radius: 18px; }
  .lb-podium-item.place-1 { padding-top: 28px; }
  .lb-podium-score { font-size: 20px; }
  .lb-podium-score small, .lb-podium-handle { display: none; }
  .lb-medal { top: 8px; left: 8px; width: 22px; height: 22px; font-size: 11px; }
}
@media (prefers-reduced-motion: reduce) {
  .lb-skeleton { animation: none; }
  .lb-btn-primary, .lb-tab, .lb-back { transition: none; }
}
`;
