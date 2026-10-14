import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProfileSidebar from '../components/ProfileSidebar';
import { userAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { addToCalendar } from '../utils/calendar';

const PLATFORMS = {
  Codeforces: '#FF5A5F',
  LeetCode: '#FFA116',
  AtCoder: '#22D3A6',
  CodeChef: '#C8A97E',
  GeeksforGeeks: '#2FB574',
};
const colorOf = (platform) => PLATFORMS[platform] || '#818cf8';

const GAME_NAMES = {
  complexity_guess: { name: 'Complexity Quiz', to: '/games/complexity' },
  debug_the_code: { name: 'Debug the Code', to: '/games/debug' },
};

const ICONS = {
  bookmark: 'M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1Z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  live: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M5.6 18.4a9 9 0 0 1 0-12.8M18.4 5.6a9 9 0 0 1 0 12.8',
  layers: 'M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  calendarPlus: 'M7 3v3M17 3v3M4 9h16M12 12v6M9 15h6M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4',
};

function Glyph({ name, className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function timing(contest, now) {
  const start = new Date(contest.startTime).getTime();
  const end = start + (contest.duration || 0) * 60_000;
  if (now >= end) return { state: 'ended', label: 'Ended' };
  if (now >= start) return { state: 'live', label: 'Live now' };
  const mins = Math.round((start - now) / 60_000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  return { state: 'upcoming', label: d > 0 ? `in ${d}d ${h}h` : h > 0 ? `in ${h}h ${m}m` : `in ${m}m` };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/* ─── Small pieces ────────────────────────────────────────────── */

function Stat({ icon, label, value, tone }) {
  return (
    <div className="pf-stat" style={{ '--tone': tone }}>
      <span className="pf-stat-icon"><Glyph name={icon} /></span>
      <div className="pf-stat-value">{value}</div>
      <div className="pf-stat-label">{label}</div>
    </div>
  );
}

function SectionHead({ eyebrow, title, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="pf-eyebrow">{eyebrow}</p>
        <h2 className="pf-h2 mt-2">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function AccuracyRing({ value }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="pf-ring">
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r={r} className="pf-ring-track" />
        <circle cx="36" cy="36" r={r} className="pf-ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <span>{Math.round(pct)}%</span>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function Profile() {
  const { user: authUser } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const user = profile || authUser;

  // Scroll to a section when arriving from another profile page's sidebar
  useEffect(() => {
    const target = location.state?.scrollTo;
    if (!target) return undefined;
    window.history.replaceState({}, document.title);
    const t = setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    return () => clearTimeout(t);
  }, [location]);

  const loadSaved = async () => {
    try {
      const { data } = await userAPI.getSavedContests();
      setSaved(
        data
          .map((item) => ({ ...(item.contest || {}), savedContestId: item.id, status: item.status }))
          .filter((c) => c.id),
      );
    } catch (err) {
      toast.error('Could not load your saved contests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
    userAPI.getProfile().then(({ data }) => setProfile(data)).catch(() => {});
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const removeContest = async (contest) => {
    try {
      await userAPI.removeContest(contest.id);
      setSaved((list) => list.filter((c) => c.id !== contest.id));
      toast.success('Removed from your list');
    } catch {
      toast.error('Could not remove this contest');
    }
  };

  const sorted = useMemo(
    () => [...saved].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [saved],
  );
  const withTiming = sorted.map((c) => ({ ...c, timing: timing(c, now) }));
  const active = withTiming.filter((c) => c.timing.state !== 'ended');
  const ended = withTiming.filter((c) => c.timing.state === 'ended');
  const stats = {
    saved: saved.length,
    upcoming: withTiming.filter((c) => c.timing.state === 'upcoming').length,
    live: withTiming.filter((c) => c.timing.state === 'live').length,
    platforms: new Set(saved.map((c) => c.platform)).size,
  };

  const platformSplit = Object.entries(
    saved.reduce((acc, c) => ({ ...acc, [c.platform]: (acc[c.platform] || 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1]);

  const details = [
    { label: 'University', value: user?.university },
    { label: 'Department', value: user?.department },
    { label: 'Codeforces', value: user?.codeforceHandle, href: user?.codeforceHandle && `https://codeforces.com/profile/${user.codeforceHandle}` },
    { label: 'LeetCode', value: user?.leetcodeUsername, href: user?.leetcodeUsername && `https://leetcode.com/u/${user.leetcodeUsername}` },
    { label: 'AtCoder', value: user?.atCoderHandle, href: user?.atCoderHandle && `https://atcoder.jp/users/${user.atCoderHandle}` },
    { label: 'CodeChef', value: user?.codeChefHandle, href: user?.codeChefHandle && `https://www.codechef.com/users/${user.codeChefHandle}` },
  ];
  const completion = Math.round(
    (([user?.bio, user?.profilePictureUrl].filter(Boolean).length + details.filter((d) => d.value).length) / (details.length + 2)) * 100,
  );

  const games = profile?.brainGymStats || [];
  const firstName = (user?.displayName || '').split(' ')[0] || 'coder';

  return (
    <div className="pf-root">
      <style>{STYLES}</style>
      <div className="pf-glow" aria-hidden="true" />

      <div className="pf-wrap relative grid grid-cols-1 gap-8 py-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-14">
        <div>
          <ProfileSidebar />
        </div>

        <div className="min-w-0 space-y-14">
          {/* ── Header ─────────────────────────────── */}
          <section id="overview" className="scroll-mt-28">
            <p className="pf-eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
              <div className="min-w-0">
                <h1 className="pf-h1">{greeting()}, {firstName}.</h1>
                <p className="pf-lead mt-3 max-w-xl">
                  {stats.upcoming > 0
                    ? `You have ${stats.upcoming} upcoming contest${stats.upcoming === 1 ? '' : 's'} on your list.`
                    : 'Your list is clear. Find your next contest to get started.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/profile/settings" className="pf-btn-ghost"><Glyph name="edit" /> Edit profile</Link>
                <Link to="/" className="pf-btn-primary">Find contests <Glyph name="arrow" /></Link>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Stat icon="bookmark" label="Saved contests" value={stats.saved} tone="#7dd3fc" />
              <Stat icon="clock" label="Upcoming" value={stats.upcoming} tone="#6ee7b7" />
              <Stat icon="live" label="Live now" value={stats.live} tone="#fca5a5" />
              <Stat icon="layers" label="Platforms" value={stats.platforms} tone="#fcd34d" />
            </div>
          </section>

          {/* ── Next up + profile card ─────────────── */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
            <section className="pf-panel">
              <SectionHead eyebrow="Your schedule" title="Next up" />
              {loading ? (
                <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="pf-skeleton h-[68px]" />)}</div>
              ) : active.length === 0 ? (
                <div className="pf-empty">
                  <p>Nothing scheduled yet.</p>
                  <Link to="/" className="pf-link">Browse upcoming contests <Glyph name="arrow" /></Link>
                </div>
              ) : (
                <ol className="pf-timeline">
                  {active.slice(0, 4).map((c) => (
                    <li key={c.id}>
                      <span className="pf-timeline-dot" style={{ background: colorOf(c.platform), boxShadow: `0 0 12px ${colorOf(c.platform)}` }} />
                      <Link to={`/contest/${c.id}`} className="pf-timeline-row">
                        <span className="min-w-0 flex-1">
                          <span className="pf-platform" style={{ color: colorOf(c.platform) }}>{c.platform}</span>
                          <span className="pf-contest-name">{c.name}</span>
                          <span className="pf-muted">{formatDate(c.startTime)}</span>
                        </span>
                        <span className={c.timing.state === 'live' ? 'pf-when is-live' : 'pf-when'}>{c.timing.label}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="pf-panel">
              <SectionHead
                eyebrow="Profile"
                title="Your details"
                action={<Link to="/profile/settings" className="pf-link">Edit <Glyph name="arrow" /></Link>}
              />
              <div className="pf-complete">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Profile complete</span>
                  <span className="pf-mono text-slate-200">{completion}%</span>
                </div>
                <div className="pf-meter"><span style={{ width: `${completion}%` }} /></div>
              </div>
              {user?.bio && <p className="pf-bio">{user.bio}</p>}
              <dl className="pf-details">
                {details.map((d) => (
                  <div key={d.label}>
                    <dt>{d.label}</dt>
                    <dd>
                      {d.value ? (
                        d.href ? (
                          <a href={d.href} target="_blank" rel="noopener noreferrer" className="pf-handle">
                            {d.value} <Glyph name="external" className="h-3.5 w-3.5" />
                          </a>
                        ) : d.value
                      ) : (
                        <Link to="/profile/settings" className="pf-add">Add</Link>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* ── Platform split ─────────────────────── */}
          {platformSplit.length > 0 && (
            <section className="pf-panel">
              <SectionHead eyebrow="Breakdown" title="Where you compete" />
              <div className="pf-split" role="img" aria-label={platformSplit.map(([p, n]) => `${p}: ${n}`).join(', ')}>
                {platformSplit.map(([p, n]) => (
                  <span key={p} style={{ flexGrow: n, background: colorOf(p) }} />
                ))}
              </div>
              <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                {platformSplit.map(([p, n]) => (
                  <li key={p} className="flex items-center gap-2.5 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(p) }} />
                    <span className="text-slate-300">{p}</span>
                    <span className="pf-mono text-slate-500">{n} · {Math.round((n / stats.saved) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Brain Gym ──────────────────────────── */}
          <section>
            <SectionHead
              eyebrow="Brain Gym"
              title="Game performance"
              action={<Link to="/profile/brain-gym" className="pf-link">Full stats <Glyph name="arrow" /></Link>}
            />
            {games.length === 0 ? (
              <div className="pf-panel pf-empty">
                <p>You haven&apos;t played yet. A round takes about two minutes.</p>
                <Link to="/games" className="pf-link">Play Brain Gym <Glyph name="arrow" /></Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {games.map((g) => {
                  const meta = GAME_NAMES[g.gameType] || { name: g.gameType, to: '/games' };
                  return (
                    <div key={g.gameType} className="pf-panel pf-game">
                      <AccuracyRing value={g.accuracy} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="pf-h3">{meta.name}</h3>
                          <Link to={meta.to} className="pf-link text-sm">Play</Link>
                        </div>
                        <dl className="pf-game-stats">
                          <div><dt>Correct</dt><dd>{g.totalCorrect}/{g.totalAttempted}</dd></div>
                          <div><dt>Best streak</dt><dd>{g.bestStreak}</dd></div>
                          <div><dt>Last played</dt><dd>{new Date(g.lastPlayedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</dd></div>
                        </dl>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Saved contests ─────────────────────── */}
          <section id="saved" className="scroll-mt-28">
            <SectionHead
              eyebrow="Your list"
              title={`Saved contests${saved.length ? ` (${saved.length})` : ''}`}
            />
            {loading ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="pf-skeleton h-[76px]" />)}</div>
            ) : saved.length === 0 ? (
              <div className="pf-panel pf-empty">
                <p>No saved contests yet. Bookmark rounds from the contest list and they&apos;ll appear here.</p>
                <Link to="/" className="pf-link">Browse contests <Glyph name="arrow" /></Link>
              </div>
            ) : (
              <ul className="pf-saved">
                {[...active, ...ended].map((c) => (
                  <li key={c.id} className={c.timing.state === 'ended' ? 'is-ended' : undefined}>
                    <span className="pf-saved-bar" style={{ background: colorOf(c.platform) }} />
                    <Link to={`/contest/${c.id}`} className="min-w-0 flex-1">
                      <span className="pf-contest-name">{c.name}</span>
                      <span className="pf-muted">
                        <span style={{ color: colorOf(c.platform) }}>{c.platform}</span> · {formatDate(c.startTime)} · {c.duration} min
                      </span>
                    </Link>
                    <span className={c.timing.state === 'live' ? 'pf-when is-live' : 'pf-when'}>{c.timing.label}</span>
                    <div className="pf-actions">
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="pf-icon-btn" aria-label={`Open ${c.name} on ${c.platform}`} title="Open contest page">
                        <Glyph name="external" />
                      </a>
                      {c.timing.state !== 'ended' && (
                        <button
                          type="button"
                          className="pf-icon-btn"
                          aria-label={`Add ${c.name} to calendar`}
                          title="Add to calendar"
                          onClick={() => addToCalendar({
                            id: c.id,
                            name: c.name,
                            start: new Date(c.startTime).toISOString(),
                            end: new Date(new Date(c.startTime).getTime() + c.duration * 60_000).toISOString(),
                            url: c.url,
                          })}
                        >
                          <Glyph name="calendarPlus" />
                        </button>
                      )}
                      <button type="button" className="pf-icon-btn is-danger" aria-label={`Remove ${c.name}`} title="Remove" onClick={() => removeContest(c)}>
                        <Glyph name="trash" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

.pf-root {
  --pf-line: rgba(255,255,255,0.07);
  --pf-line-strong: rgba(255,255,255,0.12);
  position: relative; overflow-x: clip; min-height: 100vh;
  background: #06070c; color: #cbd5e1;
  font-family: 'DM Sans', system-ui, sans-serif;
}
.pf-wrap { width: min(100% - 32px, 1240px); margin-inline: auto; }
.pf-glow {
  position: absolute; top: -200px; left: 20%; width: 900px; height: 520px; pointer-events: none;
  background: radial-gradient(closest-side, rgba(56,189,248,0.10), transparent),
              radial-gradient(closest-side at 80% 60%, rgba(52,211,153,0.07), transparent);
  filter: blur(30px);
}

.pf-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; }
.pf-h1 { font-weight: 700; color: #f8fafc; font-size: clamp(32px, 4vw, 46px); line-height: 1.1; letter-spacing: -0.03em; }
.pf-h2 { font-weight: 600; color: #f1f5f9; font-size: 21px; letter-spacing: -0.02em; }
.pf-h3 { font-weight: 600; color: #f1f5f9; font-size: 17px; }
.pf-lead { font-size: 17px; line-height: 1.6; color: #94a3b8; }
.pf-mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }
.pf-muted { display: block; margin-top: 4px; font-size: 13px; color: #64748b; }

.pf-btn-primary, .pf-btn-ghost {
  display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 999px;
  font-size: 14px; font-weight: 600; transition: transform .2s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease;
}
.pf-btn-primary { color: #04121c; background: linear-gradient(100deg, #7dd3fc, #6ee7b7); box-shadow: 0 10px 30px -12px rgba(56,189,248,0.6), inset 0 1px 0 rgba(255,255,255,0.5); }
.pf-btn-primary:hover { transform: translateY(-1px); }
.pf-btn-ghost { color: #e2e8f0; border: 1px solid var(--pf-line-strong); background: rgba(255,255,255,0.02); }
.pf-btn-ghost:hover { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.05); }
.pf-link { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: #7dd3fc; transition: gap .2s ease, color .2s ease; }
.pf-link:hover { gap: 10px; color: #bae6fd; }

.pf-panel {
  padding: 24px; border-radius: 22px;
  background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01));
  border: 1px solid var(--pf-line);
}
.pf-skeleton { border-radius: 14px; background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.05), rgba(255,255,255,0.02)); background-size: 200% 100%; animation: pf-shimmer 1.4s linear infinite; }
@keyframes pf-shimmer { to { background-position: -200% 0; } }
.pf-empty { display: grid; gap: 12px; justify-items: start; color: #94a3b8; font-size: 15px; }

/* stats */
.pf-stat {
  position: relative; padding: 18px 20px; border-radius: 18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01));
  border: 1px solid var(--pf-line);
}
.pf-stat-icon { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; color: var(--tone); background: color-mix(in srgb, var(--tone) 12%, transparent); }
.pf-stat-value { margin-top: 16px; font-size: 34px; font-weight: 700; color: #f8fafc; letter-spacing: -0.03em; line-height: 1; }
.pf-stat-label { margin-top: 6px; font-size: 13px; color: #64748b; }

/* timeline */
.pf-timeline { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; }
.pf-timeline::before { content: ''; position: absolute; left: 5px; top: 18px; bottom: 18px; width: 1px; background: var(--pf-line-strong); }
.pf-timeline li { position: relative; display: flex; align-items: center; gap: 16px; }
.pf-timeline-dot { position: relative; flex-shrink: 0; width: 11px; height: 11px; border-radius: 99px; border: 2px solid #06070c; }
.pf-timeline-row {
  flex: 1; min-width: 0; display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 14px;
  border: 1px solid transparent; transition: background .2s ease, border-color .2s ease;
}
.pf-timeline-row:hover { background: rgba(255,255,255,0.03); border-color: var(--pf-line); }
.pf-platform { display: block; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
.pf-contest-name { display: block; margin-top: 2px; font-weight: 500; color: #f1f5f9; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pf-when { flex-shrink: 0; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #94a3b8; padding: 5px 9px; border-radius: 8px; background: rgba(255,255,255,0.04); }
.pf-when.is-live { color: #fecaca; background: rgba(248,113,113,0.12); }

/* profile details */
.pf-complete { padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,0.025); border: 1px solid var(--pf-line); }
.pf-meter { margin-top: 10px; height: 6px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
.pf-meter span { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #7dd3fc, #6ee7b7); }
.pf-bio { margin-top: 16px; font-size: 14.5px; line-height: 1.6; color: #cbd5e1; }
.pf-details { margin-top: 14px; display: grid; }
.pf-details > div { display: flex; justify-content: space-between; gap: 16px; padding: 11px 2px; border-top: 1px solid var(--pf-line); font-size: 14px; }
.pf-details dt { color: #64748b; }
.pf-details dt { flex-shrink: 0; }
.pf-details dd { color: #e2e8f0; text-align: right; min-width: 0; overflow-wrap: anywhere; }
.pf-handle { display: inline-flex; align-items: center; gap: 6px; color: #e2e8f0; }
.pf-handle:hover { color: #7dd3fc; }
.pf-add { color: #7dd3fc; font-weight: 500; }

/* platform split */
.pf-split { display: flex; gap: 4px; height: 12px; }
.pf-split span { border-radius: 99px; min-width: 12px; }

/* brain gym */
.pf-game { display: flex; align-items: center; gap: 20px; }
.pf-ring { position: relative; flex-shrink: 0; width: 76px; height: 76px; display: grid; place-items: center; }
.pf-ring svg { position: absolute; inset: 0; transform: rotate(-90deg); }
.pf-ring circle { fill: none; stroke-width: 6; }
.pf-ring-track { stroke: rgba(255,255,255,0.07); }
.pf-ring-fill { stroke: #6ee7b7; stroke-linecap: round; transition: stroke-dashoffset 1s ease; }
.pf-ring span { font-weight: 700; color: #f8fafc; font-size: 16px; }
.pf-game-stats { margin-top: 12px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.pf-game-stats dt { font-size: 12px; color: #64748b; }
.pf-game-stats dd { margin-top: 2px; font-weight: 600; color: #e2e8f0; font-size: 15px; }

/* saved list */
.pf-saved { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.pf-saved li {
  display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid var(--pf-line);
  transition: border-color .2s ease;
}
.pf-saved li:hover { border-color: var(--pf-line-strong); }
.pf-saved li.is-ended { opacity: 0.55; }
.pf-saved-bar { width: 3px; align-self: stretch; border-radius: 99px; flex-shrink: 0; }
.pf-actions { display: flex; gap: 4px; flex-shrink: 0; }
.pf-icon-btn { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: #94a3b8; transition: background .2s ease, color .2s ease; }
.pf-icon-btn:hover { color: #f1f5f9; background: rgba(255,255,255,0.06); }
.pf-icon-btn.is-danger:hover { color: #fca5a5; background: rgba(248,113,113,0.1); }

@media (max-width: 640px) {
  .pf-panel { padding: 18px; }
  .pf-saved li { flex-wrap: wrap; gap: 10px 14px; }
  .pf-saved li > a { flex-basis: calc(100% - 20px); }
  .pf-saved .pf-when { margin-left: 17px; }
  .pf-actions { margin-left: auto; }
  .pf-game { align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .pf-skeleton { animation: none; }
  .pf-ring-fill, .pf-link, .pf-btn-primary, .pf-timeline-row, .pf-icon-btn { transition: none; }
}
`;
