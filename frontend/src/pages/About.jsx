import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animate, motion, useReducedMotion } from 'framer-motion';
import { contestAPI, statsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const PLATFORMS = [
  { name: 'Codeforces', color: '#FF5A5F' },
  { name: 'LeetCode', color: '#FFA116' },
  { name: 'AtCoder', color: '#22D3A6' },
  { name: 'CodeChef', color: '#C8A97E' },
  { name: 'GeeksforGeeks', color: '#2FB574' },
];
const platformColor = (name) => PLATFORMS.find((p) => p.name === name)?.color ?? '#94a3b8';

const REPO_URL = 'https://github.com/shamiulriyad/bruhcode-platform';

/* ─── Helpers ─────────────────────────────────────────────────── */

function startsIn(contest, now) {
  const start = new Date(contest.startTime).getTime();
  const end = start + (contest.duration || 0) * 60_000;
  if (now >= start && now < end) return { label: 'Live now', live: true };
  const mins = Math.max(0, Math.round((start - now) / 60_000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return { label: `in ${d}d ${h}h`, live: false };
  if (h > 0) return { label: `in ${h}h ${m}m`, live: false };
  return { label: `in ${m}m`, live: false };
}

function CountUp({ value }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (value == null) return;
    if (reduce) { setShown(value); return; }
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduce]);
  return <>{value == null ? '—' : shown.toLocaleString()}</>;
}

function Reveal({ children, className = '', delay = 0, as = 'section' }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}

const Icon = {
  calendar: (
    <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
  ),
  users: (
    <path d="M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-5A3.5 3.5 0 0 0 4 17.5V19M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3 3 0 0 1 0 5.7" />
  ),
  lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />,
  brain: <path d="m8 9-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12" />,
  export: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

function Glyph({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {Icon[name]}
    </svg>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function About() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [nextUp, setNextUp] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    statsAPI.get().then(({ data }) => setStats(data)).catch(() => setStats({}));
    contestAPI.getAll()
      .then(({ data }) => {
        const t = Date.now();
        const upcoming = data
          .filter((c) => new Date(c.startTime).getTime() + (c.duration || 0) * 60_000 > t)
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, 4);
        setNextUp(upcoming);
      })
      .catch(() => setNextUp([]));
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const countFor = (name) => stats?.platformCounts?.find((p) => p.platform === name)?.count ?? 0;

  return (
    <div className="ab-root">
      <style>{STYLES}</style>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="ab-hero">
        <div className="ab-grid-bg" aria-hidden="true" />
        <div className="ab-wrap grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal as="div">
            <p className="ab-eyebrow"><span className="ab-dot" /> About BRUHCODE</p>
            <h1 className="ab-display mt-6">
              Every contest.
              <br />
              <span className="ab-gradient-text">One calm place.</span>
            </h1>
            <p className="ab-lead mt-7 max-w-xl">
              BRUHCODE brings the schedules of five competitive programming platforms into a single,
              always-current timeline — then gives you a room to practice them with friends.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/" className="ab-btn-primary">
                Explore contests <Glyph name="arrow" className="h-4 w-4" />
              </Link>
              <Link to={isAuthenticated ? '/rooms' : '/register'} className="ab-btn-ghost">
                {isAuthenticated ? 'Open practice rooms' : 'Create a free account'}
              </Link>
            </div>
            <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-3">
              {PLATFORMS.map((p) => (
                <li key={p.name} className="ab-platform-mini">
                  <span style={{ background: p.color }} />
                  {p.name}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal as="div" delay={0.15}>
            <div className="ab-feed">
              <div className="ab-feed-head">
                <span className="ab-mono">NEXT UP</span>
                <span className="ab-live"><i /> Live sync</span>
              </div>
              <ul>
                {nextUp === null &&
                  [0, 1, 2].map((i) => <li key={i} className="ab-feed-row ab-skeleton" />)}
                {nextUp?.length === 0 && (
                  <li className="ab-feed-empty">No upcoming contests right now — check back soon.</li>
                )}
                {nextUp?.map((c) => {
                  const when = startsIn(c, now);
                  return (
                    <li key={c.id}>
                      <Link to={`/contest/${c.id}`} className="ab-feed-row">
                        <span className="ab-feed-bar" style={{ background: platformColor(c.platform) }} />
                        <span className="min-w-0 flex-1">
                          <span className="ab-feed-platform" style={{ color: platformColor(c.platform) }}>{c.platform}</span>
                          <span className="ab-feed-name">{c.name}</span>
                        </span>
                        <span className={when.live ? 'ab-feed-when is-live' : 'ab-feed-when'}>{when.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="ab-feed-foot ab-mono">Synced from official platform sources</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Live numbers ───────────────────────────────────── */}
      <Reveal className="ab-wrap">
        <dl className="ab-stats">
          {[
            { label: 'Platforms in one feed', value: PLATFORMS.length },
            { label: 'Contests tracked', value: stats ? stats.lifetimeContests ?? 0 : null },
            { label: 'Upcoming right now', value: stats ? stats.upcomingContests ?? 0 : null },
            { label: 'Brain Gym games', value: 2 },
          ].map((s) => (
            <div key={s.label}>
              <dd className="ab-stat-value"><CountUp value={s.value} /></dd>
              <dt className="ab-stat-label">{s.label}</dt>
            </div>
          ))}
        </dl>
      </Reveal>

      {/* ── Story ──────────────────────────────────────────── */}
      <section className="ab-wrap ab-section grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal as="div">
          <p className="ab-eyebrow">Why it exists</p>
          <h2 className="ab-h2 mt-5">
            Five sites. Five time zones. <span className="text-slate-500">One missed round too many.</span>
          </h2>
        </Reveal>
        <Reveal as="div" delay={0.1} className="space-y-5">
          <p className="ab-body">
            Competitive programmers juggle Codeforces, LeetCode, AtCoder, CodeChef and GeeksforGeeks —
            each with its own calendar, its own time zone and its own way of announcing rounds. Planning a
            week of practice meant a dozen tabs and a spreadsheet.
          </p>
          <p className="ab-body">
            BRUHCODE replaces that with one timeline in your local time, and turns past contests into
            team practice: a shared clock, a live leaderboard and discussion that stays locked until
            you&apos;ve tried the problem yourself.
          </p>
        </Reveal>
      </section>

      {/* ── Bento features ─────────────────────────────────── */}
      <section className="ab-wrap ab-section">
        <Reveal as="div" className="mb-12 max-w-2xl">
          <p className="ab-eyebrow">What you get</p>
          <h2 className="ab-h2 mt-5">Built for the way coders actually train.</h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* Calendar */}
          <Reveal as="article" className="ab-tile md:col-span-4">
            <TileHead icon="calendar" title="One unified calendar"
              text="Every upcoming round from five platforms, converted to your time zone and refreshed automatically." />
            <div className="ab-mini-cal" aria-hidden="true">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                <div key={d} className="ab-mini-day">
                  <span>{d}</span>
                  {[[1, 0], [3, 2], [], [0, 4], [2], [1, 3, 0], [2, 1]][i].map((p, j) => (
                    <i key={j} style={{ background: PLATFORMS[p].color }} />
                  ))}
                </div>
              ))}
            </div>
          </Reveal>

          {/* Export */}
          <Reveal as="article" delay={0.05} className="ab-tile md:col-span-2">
            <TileHead icon="export" title="Add to your calendar"
              text="Send any contest to Google Calendar or download an .ics file in one click." />
            <div className="mt-auto flex flex-wrap gap-2 pt-8" aria-hidden="true">
              <span className="ab-chip">+ Google Calendar</span>
              <span className="ab-chip">contest.ics</span>
            </div>
          </Reveal>

          {/* Rooms */}
          <Reveal as="article" className="ab-tile md:col-span-3">
            <TileHead icon="users" title="Practice rooms with friends"
              text="Invite up to 10 people with a code. A server-synced timer and a leaderboard that updates the moment someone solves." />
            <ol className="ab-mini-board" aria-hidden="true">
              {[['riyad', 4, '1:12:40'], ['nabil', 4, '1:20:05'], ['tasnia', 3, '58:31']].map(([n, s, t], i) => (
                <li key={n}>
                  <span className="ab-mono text-slate-500">{i + 1}</span>
                  <span className="flex-1 text-slate-200">{n}</span>
                  <span className="ab-mono text-emerald-300">{s} solved</span>
                  <span className="ab-mono text-slate-500">{t}</span>
                </li>
              ))}
            </ol>
          </Reveal>

          {/* Threads */}
          <Reveal as="article" delay={0.05} className="ab-tile md:col-span-3">
            <TileHead icon="lock" title="Spoiler-safe discussion"
              text="Each problem has its own thread, unlocked only after you attempt it — so nobody ruins the solve for you." />
            <div className="ab-mini-thread" aria-hidden="true">
              <div className="is-locked"><Glyph name="lock" className="h-4 w-4" /> Problem C — attempt to unlock</div>
              <div><span className="ab-mono text-sky-300">B</span> “Binary search on the answer works here.”</div>
            </div>
          </Reveal>

          {/* Brain Gym */}
          <Reveal as="article" className="ab-tile ab-tile-wide md:col-span-6">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <TileHead icon="brain" title="Brain Gym"
                text="Quick games that sharpen contest instincts: guess the time complexity of a snippet, or spot the bug before the clock runs out. Every game has its own leaderboard." />
              <div className="ab-code" aria-hidden="true">
                <pre>{`for (int i = 1; i < n; i *= 2)
  for (int j = 0; j < n; j++)
    sum += a[j];`}</pre>
                <div className="flex flex-wrap gap-2">
                  {['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'].map((o) => (
                    <span key={o} className={o === 'O(n log n)' ? 'ab-opt is-right' : 'ab-opt'}>{o}</span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="ab-wrap ab-section">
        <Reveal as="div" className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="ab-eyebrow">How it works</p>
            <h2 className="ab-h2 mt-5">From sign-up to podium in three steps.</h2>
          </div>
          <Link to="/how-it-works" className="ab-link">Full walkthrough <Glyph name="arrow" className="h-4 w-4" /></Link>
        </Reveal>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ['01', 'Make it yours', 'Create a free account and add your Codeforces, LeetCode, AtCoder and CodeChef handles.'],
            ['02', 'Plan your week', 'Browse every upcoming round in one place, save the ones you want and add them to your calendar.'],
            ['03', 'Practice together', 'Open a room on any contest, share the invite code and race your friends on a live leaderboard.'],
          ].map(([n, t, d], i) => (
            <Reveal as="li" key={n} delay={i * 0.08} className="ab-step">
              <span className="ab-step-n">{n}</span>
              <h3 className="ab-h3 mt-8">{t}</h3>
              <p className="ab-body-sm mt-3">{d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ── Platforms ──────────────────────────────────────── */}
      <section className="ab-wrap ab-section">
        <Reveal as="div" className="mb-10 text-center">
          <p className="ab-eyebrow justify-center">Sources</p>
          <h2 className="ab-h2 mt-5">Five platforms, one feed.</h2>
        </Reveal>
        <Reveal as="div" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PLATFORMS.map((p) => (
            <div key={p.name} className="ab-platform" style={{ '--c': p.color }}>
              <span className="ab-platform-dot" />
              <span className="ab-platform-name">{p.name}</span>
              <span className="ab-mono ab-platform-count">
                {stats ? `${countFor(p.name)} upcoming` : '…'}
              </span>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ── Creator note ───────────────────────────────────── */}
      <section className="ab-wrap ab-section">
        <Reveal as="figure" className="ab-quote">
          <span className="ab-quote-mark" aria-hidden="true">“</span>
          <blockquote className="ab-quote-text">
            I kept missing rounds because they were spread across five sites and three time zones.
            BRUHCODE is the tool I wanted: one place to see what&apos;s next, and a room to practice it
            with friends.
          </blockquote>
          <figcaption className="mt-10 flex items-center gap-4">
            <span className="ab-avatar">SR</span>
            <span>
              <span className="block font-semibold text-slate-100">Shamiul Islam Riyad</span>
              <span className="ab-mono block text-xs text-slate-500">Creator, BRUHCODE</span>
            </span>
          </figcaption>
        </Reveal>
      </section>

      {/* ── Built with + CTA ───────────────────────────────── */}
      <section className="ab-wrap pb-24">
        <Reveal as="div" className="mb-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <span className="ab-mono text-[11px] tracking-[0.2em] text-slate-600">BUILT WITH</span>
          {['React 19', 'ASP.NET Core', 'SignalR', 'PostgreSQL', 'Tailwind CSS'].map((t) => (
            <span key={t} className="ab-mono text-sm text-slate-400">{t}</span>
          ))}
        </Reveal>

        <Reveal as="div" className="ab-cta">
          <div className="ab-cta-inner">
            <h2 className="ab-h2 max-w-2xl">Your next contest is already on the calendar.</h2>
            <p className="ab-body mt-5 max-w-xl">
              Free to use. No more tab juggling — just open BRUHCODE and see what&apos;s next.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to={isAuthenticated ? '/' : '/register'} className="ab-btn-primary">
                {isAuthenticated ? 'Go to contests' : 'Get started free'} <Glyph name="arrow" className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="ab-btn-ghost">Contact us</Link>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="ab-link ml-2">
                View on GitHub <Glyph name="arrow" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function TileHead({ icon, title, text }) {
  return (
    <div>
      <span className="ab-tile-icon"><Glyph name={icon} /></span>
      <h3 className="ab-h3 mt-6">{title}</h3>
      <p className="ab-body-sm mt-3 max-w-md">{text}</p>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

.ab-root {
  --ab-bg: #06070c;
  --ab-line: rgba(255,255,255,0.07);
  --ab-line-strong: rgba(255,255,255,0.12);
  --ab-sky: #38bdf8;
  --ab-emerald: #34d399;
  background: var(--ab-bg);
  color: #cbd5e1;
  font-family: 'DM Sans', system-ui, sans-serif;
  overflow: hidden;
}
.ab-wrap { width: min(100% - 32px, 1160px); margin-inline: auto; }
.ab-section { padding-block: 72px; }
@media (min-width: 768px) { .ab-section { padding-block: 104px; } }

/* type */
.ab-display {
  font-weight: 700; color: #f8fafc;
  font-size: clamp(40px, 5.4vw, 72px); line-height: 1.05; letter-spacing: -0.025em;
}
.ab-h2 {
  font-weight: 700; color: #f1f5f9;
  font-size: clamp(30px, 3.8vw, 44px); line-height: 1.12; letter-spacing: -0.03em;
}
.ab-h3 { font-weight: 600; color: #f1f5f9; font-size: 20px; letter-spacing: -0.015em; }
.ab-lead { font-size: clamp(17px, 1.6vw, 20px); line-height: 1.65; color: #94a3b8; }
.ab-body { font-size: 17px; line-height: 1.75; color: #94a3b8; }
.ab-body-sm { font-size: 15px; line-height: 1.7; color: #8b97ab; }
.ab-mono { font-family: 'JetBrains Mono', monospace; }
.ab-gradient-text {
  background: linear-gradient(100deg, var(--ab-sky) 10%, var(--ab-emerald) 90%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ab-eyebrow {
  display: flex; align-items: center; gap: 10px;
  font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.22em;
  text-transform: uppercase; color: #7dd3fc;
}
.ab-dot { width: 6px; height: 6px; border-radius: 99px; background: var(--ab-emerald); box-shadow: 0 0 12px var(--ab-emerald); }

/* hero */
.ab-hero { position: relative; padding: 88px 0 72px; }
@media (min-width: 1024px) { .ab-hero { padding: 120px 0 96px; } }
.ab-grid-bg {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(var(--ab-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--ab-line) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%);
}
.ab-grid-bg::after {
  content: ''; position: absolute; inset: -20% 10% auto 30%; height: 70%;
  background: radial-gradient(closest-side, rgba(56,189,248,0.16), transparent),
              radial-gradient(closest-side at 70% 60%, rgba(52,211,153,0.12), transparent);
  filter: blur(20px);
}
.ab-hero .ab-wrap { position: relative; }

.ab-btn-primary {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 14px 24px; border-radius: 999px; font-weight: 600; font-size: 15px;
  color: #04121c; background: linear-gradient(100deg, #7dd3fc, #6ee7b7);
  box-shadow: 0 10px 40px -10px rgba(56,189,248,0.55), inset 0 1px 0 rgba(255,255,255,0.5);
  transition: transform .2s ease, box-shadow .2s ease;
}
.ab-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 16px 50px -12px rgba(56,189,248,0.7), inset 0 1px 0 rgba(255,255,255,0.5); }
.ab-btn-ghost {
  display: inline-flex; align-items: center; padding: 14px 22px; border-radius: 999px;
  font-weight: 500; font-size: 15px; color: #e2e8f0;
  border: 1px solid var(--ab-line-strong); background: rgba(255,255,255,0.02);
  transition: border-color .2s ease, background .2s ease;
}
.ab-btn-ghost:hover { border-color: rgba(255,255,255,0.28); background: rgba(255,255,255,0.05); }
.ab-link { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; color: #7dd3fc; transition: gap .2s ease, color .2s ease; }
.ab-link:hover { gap: 12px; color: #bae6fd; }

.ab-platform-mini { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #64748b; }
.ab-platform-mini span { width: 7px; height: 7px; border-radius: 99px; }

/* live feed */
.ab-feed {
  position: relative; border-radius: 24px; padding: 8px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015));
  border: 1px solid var(--ab-line-strong);
  box-shadow: 0 40px 120px -40px rgba(56,189,248,0.35), 0 0 0 1px rgba(0,0,0,0.4);
  backdrop-filter: blur(14px);
}
.ab-feed-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px 12px; font-size: 11px; letter-spacing: 0.2em; color: #64748b; }
.ab-live { display: inline-flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.08em; color: #6ee7b7; }
.ab-live i { width: 7px; height: 7px; border-radius: 99px; background: #34d399; animation: ab-pulse 2s ease-in-out infinite; }
@keyframes ab-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.6); } 50% { box-shadow: 0 0 0 6px rgba(52,211,153,0); } }
.ab-feed ul { display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; }
.ab-feed-row {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 16px;
  background: rgba(6,7,12,0.7); border: 1px solid var(--ab-line);
  transition: border-color .2s ease, transform .2s ease;
}
a.ab-feed-row:hover { border-color: var(--ab-line-strong); transform: translateX(2px); }
.ab-feed-bar { width: 3px; align-self: stretch; border-radius: 99px; }
.ab-feed-platform { display: block; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
.ab-feed-name { display: block; margin-top: 3px; color: #e2e8f0; font-weight: 500; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ab-feed-when { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #94a3b8; white-space: nowrap; }
.ab-feed-when.is-live { color: #fca5a5; }
.ab-feed-empty { padding: 28px 16px; text-align: center; color: #64748b; font-size: 14px; }
.ab-feed-foot { padding: 14px 16px 10px; font-size: 11px; color: #475569; letter-spacing: 0.06em; }
.ab-skeleton { height: 66px; background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.05), rgba(255,255,255,0.02)); background-size: 200% 100%; animation: ab-shimmer 1.4s linear infinite; }
@keyframes ab-shimmer { to { background-position: -200% 0; } }

/* stats */
.ab-stats {
  display: grid; grid-template-columns: repeat(2, 1fr);
  border-top: 1px solid var(--ab-line); border-bottom: 1px solid var(--ab-line);
}
.ab-stats > div { padding: 32px 8px; }
.ab-stats > div:nth-child(odd) { border-right: 1px solid var(--ab-line); }
.ab-stats > div:nth-child(-n+2) { border-bottom: 1px solid var(--ab-line); }
@media (min-width: 768px) {
  .ab-stats { grid-template-columns: repeat(4, 1fr); }
  .ab-stats > div { padding: 40px 28px; border-bottom: 0 !important; }
  .ab-stats > div:not(:last-child) { border-right: 1px solid var(--ab-line); }
}
.ab-stat-value { font-weight: 700; font-size: clamp(36px, 4.5vw, 56px); color: #f8fafc; letter-spacing: -0.03em; line-height: 1; }
.ab-stat-label { margin-top: 12px; font-size: 14px; color: #64748b; }

/* tiles */
.ab-tile {
  position: relative; display: flex; flex-direction: column; min-height: 300px;
  padding: 30px; border-radius: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01));
  border: 1px solid var(--ab-line);
  transition: border-color .3s ease, transform .3s ease;
}
.ab-tile:hover { border-color: var(--ab-line-strong); }
.ab-tile::before {
  content: ''; position: absolute; inset: 0 0 auto; height: 1px; border-radius: 24px 24px 0 0;
  background: linear-gradient(90deg, transparent, rgba(125,211,252,0.35), transparent);
  opacity: 0; transition: opacity .3s ease;
}
.ab-tile:hover::before { opacity: 1; }
.ab-tile-wide { min-height: 0; }
.ab-tile-icon {
  display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 14px;
  color: #7dd3fc; background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.18);
}
.ab-chip { font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--ab-line-strong); color: #cbd5e1; background: rgba(6,7,12,0.6); }

.ab-mini-cal { margin-top: auto; padding-top: 32px; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.ab-mini-day { display: flex; flex-direction: column; gap: 6px; min-height: 104px; padding: 10px 8px; border-radius: 12px; background: rgba(6,7,12,0.55); border: 1px solid var(--ab-line); }
.ab-mini-day span { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #475569; margin-bottom: 4px; }
.ab-mini-day i { display: block; height: 6px; border-radius: 99px; opacity: 0.9; }

.ab-mini-board { margin-top: auto; padding-top: 28px; display: grid; gap: 6px; }
.ab-mini-board li { display: flex; align-items: center; gap: 14px; padding: 11px 14px; border-radius: 12px; background: rgba(6,7,12,0.55); border: 1px solid var(--ab-line); font-size: 14px; }
.ab-mini-board li:first-child { border-color: rgba(52,211,153,0.25); }
.ab-mini-board .ab-mono { font-size: 12px; }

.ab-mini-thread { margin-top: auto; padding-top: 28px; display: grid; gap: 6px; font-size: 14px; }
.ab-mini-thread div { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; background: rgba(6,7,12,0.55); border: 1px solid var(--ab-line); color: #cbd5e1; }
.ab-mini-thread .is-locked { color: #64748b; border-style: dashed; }

.ab-code { padding: 22px; border-radius: 18px; background: rgba(6,7,12,0.75); border: 1px solid var(--ab-line); }
.ab-code pre { margin: 0 0 18px; font-family: 'JetBrains Mono', monospace; font-size: 13.5px; line-height: 1.75; color: #a5b4fc; white-space: pre; overflow-x: auto; }
.ab-opt { font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 7px 11px; border-radius: 9px; border: 1px solid var(--ab-line-strong); color: #94a3b8; }
.ab-opt.is-right { color: #6ee7b7; border-color: rgba(52,211,153,0.45); background: rgba(52,211,153,0.08); }

/* steps */
.ab-step { position: relative; padding: 30px; border-radius: 24px; border: 1px solid var(--ab-line); background: rgba(255,255,255,0.015); }
.ab-step-n { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #7dd3fc; padding: 6px 10px; border-radius: 99px; border: 1px solid rgba(56,189,248,0.25); }

/* platforms */
.ab-platform {
  display: flex; flex-direction: column; gap: 4px; padding: 22px; border-radius: 18px;
  border: 1px solid var(--ab-line); background: rgba(255,255,255,0.015);
  transition: border-color .25s ease, background .25s ease;
}
.ab-platform:hover { border-color: color-mix(in srgb, var(--c) 45%, transparent); background: color-mix(in srgb, var(--c) 6%, transparent); }
.ab-platform-dot { width: 9px; height: 9px; border-radius: 99px; background: var(--c); box-shadow: 0 0 14px var(--c); margin-bottom: 18px; }
.ab-platform-name { font-weight: 600; color: #f1f5f9; font-size: 16px; }
.ab-platform-count { font-size: 12px; color: #64748b; }

/* quote */
.ab-quote { position: relative; max-width: 900px; margin: 0 auto; padding: 8px 0; }
.ab-quote-mark { position: absolute; top: -40px; left: -10px; font-size: 160px; font-weight: 700; line-height: 1; color: rgba(56,189,248,0.12); }
.ab-quote-text { position: relative; font-weight: 500; font-size: clamp(22px, 2.8vw, 32px); line-height: 1.45; letter-spacing: -0.02em; color: #e2e8f0; }
.ab-avatar { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 99px; font-weight: 700; color: #04121c; background: linear-gradient(135deg, #7dd3fc, #6ee7b7); }

/* cta */
.ab-cta { position: relative; padding: 1px; border-radius: 32px; background: linear-gradient(120deg, rgba(56,189,248,0.5), rgba(255,255,255,0.06) 40%, rgba(52,211,153,0.45)); }
.ab-cta-inner {
  border-radius: 31px; padding: clamp(32px, 6vw, 72px);
  background:
    radial-gradient(600px 300px at 90% 0%, rgba(52,211,153,0.12), transparent 60%),
    radial-gradient(600px 300px at 0% 100%, rgba(56,189,248,0.12), transparent 60%),
    #080a11;
}

@media (prefers-reduced-motion: reduce) {
  .ab-live i, .ab-skeleton { animation: none; }
  .ab-btn-primary, .ab-tile, .ab-feed-row, .ab-link { transition: none; }
}
`;
