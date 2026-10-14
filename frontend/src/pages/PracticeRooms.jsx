import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { contestAPI, roomAPI } from '../api';

const PLATFORM_COLORS = {
  Codeforces: '#FF5A5F',
  LeetCode: '#FFA116',
  AtCoder: '#22D3A6',
  CodeChef: '#C8A97E',
  GeeksforGeeks: '#2FB574',
};
const colorOf = (platform) => PLATFORM_COLORS[platform] || '#818cf8';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Live', label: 'Live' },
  { id: 'Scheduled', label: 'Upcoming' },
  { id: 'Ended', label: 'Ended' },
];
const STATUS_ORDER = { Live: 0, Scheduled: 1, Ended: 2 };

const ICONS = {
  plus: 'M12 5v14M5 12h14',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  users: 'M16 19v-1.5A3.5 3.5 0 0 0 12.5 14h-5A3.5 3.5 0 0 0 4 17.5V19M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3 3 0 0 1 0 5.7',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  check: 'M5 13l4 4L19 7',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8Z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  x: 'M6 6l12 12M18 6 6 18',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9Z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 13v4M8 20h8',
};

function Glyph({ name, className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function relativeStart(iso, now) {
  const mins = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (mins <= 0) return 'Starting now';
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `Starts in ${d}d ${h}h`;
  if (h > 0) return `Starts in ${h}h ${m}m`;
  return `Starts in ${m}m`;
}

const formatWhen = (iso) =>
  new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const errorText = (err, fallback) => {
  const data = err?.response?.data;
  if (typeof data === 'string') return data;
  return data?.error || data?.title || fallback;
};

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}

// Live first, then upcoming (soonest first), then ended (most recent first)
const sortRooms = (list) =>
  [...list].sort((a, b) => {
    const byStatus = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
    if (byStatus !== 0) return byStatus;
    const diff = new Date(a.startTime) - new Date(b.startTime);
    return a.status === 'Ended' ? -diff : diff;
  });

/* ─── Page ────────────────────────────────────────────────────── */

export default function PracticeRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null); // 'create' | 'join' | null
  const [joiningId, setJoiningId] = useState(null);
  const [now, setNow] = useState(Date.now());

  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await roomAPI.getAll();
      setRooms(data);
    } catch {
      toast.error('Could not load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [fetchRooms]);

  const myRooms = useMemo(() => sortRooms(rooms.filter((r) => r.isMember)), [rooms]);
  const publicRooms = useMemo(
    () => sortRooms(rooms.filter((r) => !r.isMember && r.visibility === 'Public' && r.status !== 'Ended')),
    [rooms],
  );
  const counts = FILTERS.reduce(
    (acc, f) => ({ ...acc, [f.id]: f.id === 'all' ? myRooms.length : myRooms.filter((r) => r.status === f.id).length }),
    {},
  );
  const visibleRooms = filter === 'all' ? myRooms : myRooms.filter((r) => r.status === filter);

  const openRoom = (room) => {
    if (room.status === 'Live') navigate(`/rooms/${room.id}/live`);
    else if (room.status === 'Ended') navigate(`/rooms/${room.id}/summary`);
    else navigate(`/rooms/${room.id}/lobby`);
  };

  const joinPublic = async (room) => {
    setJoiningId(room.id);
    try {
      await roomAPI.joinByCode(room.inviteCode);
      toast.success(`Joined ${room.name}`);
      openRoom(room);
    } catch (err) {
      toast.error(errorText(err, 'Could not join this room'));
      fetchRooms();
    } finally {
      setJoiningId(null);
    }
  };

  const closeModal = useCallback(() => setModal(null), []);

  return (
    <div className="rm-root">
      <style>{STYLES}</style>
      <div className="rm-glow" aria-hidden="true" />

      <div className="rm-wrap relative py-12 lg:py-16">
        {/* ── Header ─────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="rm-eyebrow">Practice rooms</p>
            <h1 className="rm-h1 mt-3">Practice together.</h1>
            <p className="rm-lead mt-3 max-w-xl">
              Re-sit a contest with friends on a shared clock, race up a live leaderboard, and discuss each problem once you&apos;ve tried it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rm-btn-ghost" onClick={() => setModal('join')}>
              <Glyph name="link" /> Join with code
            </button>
            <button type="button" className="rm-btn-primary" onClick={() => setModal('create')}>
              <Glyph name="plus" /> Create room
            </button>
          </div>
        </div>

        {/* ── My rooms ───────────────────────────── */}
        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="rm-h2">Your rooms</h2>
            {myRooms.length > 0 && (
              <div className="rm-filters" role="tablist" aria-label="Filter rooms">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.id}
                    className={filter === f.id ? 'rm-filter is-active' : 'rm-filter'}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                    <span className="rm-filter-count">{counts[f.id]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="rm-grid">{[0, 1, 2].map((i) => <div key={i} className="rm-skeleton" />)}</div>
          ) : myRooms.length === 0 ? (
            <Onboarding onCreate={() => setModal('create')} onJoin={() => setModal('join')} />
          ) : visibleRooms.length === 0 ? (
            <div className="rm-panel rm-empty-small">No {FILTERS.find((f) => f.id === filter).label.toLowerCase()} rooms right now.</div>
          ) : (
            <div className="rm-grid">
              {visibleRooms.map((room) => (
                <RoomCard key={room.id} room={room} now={now} onOpen={() => openRoom(room)} />
              ))}
            </div>
          )}
        </section>

        {/* ── Public rooms ───────────────────────── */}
        {!loading && (
          <section className="mt-16">
            <div className="mb-5">
              <h2 className="rm-h2">Open public rooms</h2>
              <p className="rm-muted mt-1">Anyone can join these — jump in and practice with the community.</p>
            </div>
            {publicRooms.length === 0 ? (
              <div className="rm-panel rm-empty-small">
                No public rooms are open right now. Create one and set it to <strong className="text-slate-200">Public</strong> to invite everyone.
              </div>
            ) : (
              <div className="rm-grid">
                {publicRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    now={now}
                    joining={joiningId === room.id}
                    onJoin={() => joinPublic(room)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <AnimatePresence>
        {modal === 'create' && (
          <CreateRoomModal
            onClose={closeModal}
            onCreated={(room) => {
              setModal(null);
              navigate(`/rooms/${room.id}/lobby`);
            }}
          />
        )}
        {modal === 'join' && (
          <JoinRoomModal
            onClose={closeModal}
            onJoined={(roomId) => {
              setModal(null);
              navigate(`/rooms/${roomId}/lobby`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Room card ───────────────────────────────────────────────── */

function RoomCard({ room, now, onOpen, onJoin, joining }) {
  const [copied, setCopied] = useState(false);
  const full = room.memberCount >= room.maxMembers;
  const isPublicListing = Boolean(onJoin);

  const copyCode = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(room.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy the code');
    }
  };

  const status =
    room.status === 'Live'
      ? <span className="rm-status is-live"><i /> Live now</span>
      : room.status === 'Ended'
        ? <span className="rm-status is-ended">Ended</span>
        : <span className="rm-status is-upcoming"><Glyph name="clock" className="h-3.5 w-3.5" /> {relativeStart(room.startTime, now)}</span>;

  const cta = isPublicListing
    ? { label: full ? 'Room full' : joining ? 'Joining…' : 'Join room', onClick: onJoin, disabled: full || joining }
    : { label: room.status === 'Live' ? 'Enter room' : room.status === 'Ended' ? 'View results' : 'Open lobby', onClick: onOpen };

  return (
    <article className={`rm-card${room.status === 'Live' ? ' is-live' : ''}${room.status === 'Ended' ? ' is-ended' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        {status}
        <span className="rm-platform">
          <span style={{ background: colorOf(room.contestPlatform) }} />
          {room.contestPlatform}
        </span>
      </div>

      <h3 className="rm-card-title">{room.name}</h3>
      <p className="rm-card-contest" title={room.contestName}>{room.contestName}</p>

      <div className="rm-meta">
        <span><Glyph name="clock" className="h-3.5 w-3.5" /> {formatWhen(room.startTime)} · {room.durationMinutes} min</span>
      </div>

      <div className="rm-capacity">
        <div className="flex items-center justify-between text-[13px]">
          <span className="inline-flex items-center gap-1.5 text-slate-400"><Glyph name="users" className="h-3.5 w-3.5" /> {room.memberCount}/{room.maxMembers} members</span>
          {room.isHost ? (
            <span className="rm-host"><Glyph name="crown" className="h-3.5 w-3.5" /> You&apos;re host</span>
          ) : (
            <span className="text-slate-500">Host: {room.hostName}</span>
          )}
        </div>
        <div className="rm-bar"><span style={{ width: `${Math.min(100, (room.memberCount / room.maxMembers) * 100)}%` }} /></div>
      </div>

      <div className="rm-card-footer">
        {!isPublicListing && room.status !== 'Ended' ? (
          <button type="button" className="rm-code" onClick={copyCode} aria-label={`Copy invite code ${room.inviteCode}`}>
            <span className="rm-mono">{room.inviteCode}</span>
            <Glyph name={copied ? 'check' : 'copy'} className="h-3.5 w-3.5" />
          </button>
        ) : <span />}
        <button type="button" className={room.status === 'Live' || isPublicListing ? 'rm-btn-primary rm-btn-sm' : 'rm-btn-ghost rm-btn-sm'} onClick={cta.onClick} disabled={cta.disabled}>
          {cta.label} {!cta.disabled && <Glyph name="arrow" className="h-3.5 w-3.5" />}
        </button>
      </div>
    </article>
  );
}

/* ─── Onboarding (no rooms yet) ───────────────────────────────── */

function Onboarding({ onCreate, onJoin }) {
  const steps = [
    { icon: 'plus', title: 'Create a room', text: 'Pick any contest, set a start time and list the problems to solve.' },
    { icon: 'link', title: 'Share the code', text: 'Send the 8-character invite code to up to 9 friends.' },
    { icon: 'trophy', title: 'Race the clock', text: 'Mark problems solved, climb the live leaderboard, then compare results.' },
  ];
  return (
    <div className="rm-panel rm-onboarding">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="rm-step">
            <span className="rm-step-icon"><Glyph name={s.icon} /></span>
            <span className="rm-mono text-xs text-slate-500">STEP {i + 1}</span>
            <h3 className="rm-h3 mt-1">{s.title}</h3>
            <p className="rm-muted mt-2">{s.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" className="rm-btn-primary" onClick={onCreate}><Glyph name="plus" /> Create your first room</button>
        <button type="button" className="rm-btn-text" onClick={onJoin}>I have an invite code</button>
      </div>
    </div>
  );
}

/* ─── Modals ──────────────────────────────────────────────────── */

function Modal({ title, subtitle, onClose, children, wide = false }) {
  const reduce = useReducedMotion();
  useEscape(onClose);
  return (
    <motion.div
      className="rm-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rm-modal-title"
        className={wide ? 'rm-modal is-wide' : 'rm-modal'}
        initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="rm-modal-head">
          <div>
            <h2 id="rm-modal-title" className="rm-h2">{title}</h2>
            {subtitle && <p className="rm-muted mt-1">{subtitle}</p>}
          </div>
          <button type="button" className="rm-icon-btn" onClick={onClose} aria-label="Close">
            <Glyph name="x" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function CreateRoomModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [contests, setContests] = useState([]);
  const [contest, setContest] = useState(null);
  const [query, setQuery] = useState('');
  const [startTime, setStartTime] = useState(() => toLocalInput(new Date(Date.now() + 15 * 60_000)));
  const [duration, setDuration] = useState(120);
  const [visibility, setVisibility] = useState('Private');
  const [problems, setProblems] = useState([{ name: '', url: '' }, { name: '', url: '' }, { name: '', url: '' }]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
    contestAPI.getAll().then(({ data }) => setContests(data)).catch(() => {});
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contests
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.platform.toLowerCase().includes(q))
      .slice(0, 30);
  }, [contests, query]);

  // Clear a field's error as soon as the user changes that field
  const clearError = (key) => setErrors((e) => (e[key] ? { ...e, [key]: null } : e));

  const pickContest = (c) => {
    setContest(c);
    setDuration(c.duration || 120);
    if (!name.trim()) setName(`${c.name} practice`);
    setErrors((e) => ({ ...e, contest: null, name: null, duration: null }));
  };

  const setQuickStart = (minutes) => {
    setStartTime(toLocalInput(new Date(Date.now() + minutes * 60_000)));
    clearError('startTime');
  };

  const updateProblem = (i, field, value) => {
    setProblems((list) => list.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
    if (field === 'name') clearError('problems');
  };

  const submit = async (e) => {
    e.preventDefault();
    const filled = problems.filter((p) => p.name.trim());
    const next = {};
    if (!name.trim()) next.name = 'Give your room a name.';
    if (!contest) next.contest = 'Choose the contest you want to practice.';
    if (!startTime || Number.isNaN(new Date(startTime).getTime())) next.startTime = 'Pick a start time.';
    if (!duration || duration < 10 || duration > 600) next.duration = '10–600 minutes.';
    if (filled.length === 0) next.problems = 'Add at least one problem.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const { data } = await roomAPI.create({
        name: name.trim(),
        contestId: contest.id,
        startTime: new Date(startTime).toISOString(),
        durationMinutes: duration,
        visibility,
        problems: filled.map((p, i) => ({ index: String.fromCharCode(65 + i), name: p.name.trim(), url: p.url.trim() })),
      });
      toast.success(`Room created — invite code ${data.inviteCode}`);
      onCreated(data);
    } catch (err) {
      toast.error(errorText(err, 'Could not create the room'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Create a practice room" subtitle="You'll get an invite code to share once it's created." onClose={onClose} wide>
      <form onSubmit={submit} noValidate className="rm-modal-body">
        {/* Contest */}
        <div>
          <span className="rm-label">Contest</span>
          {contest ? (
            <div className="rm-picked">
              <span className="rm-platform"><span style={{ background: colorOf(contest.platform) }} />{contest.platform}</span>
              <span className="min-w-0 flex-1 truncate text-slate-100">{contest.name}</span>
              <button type="button" className="rm-btn-text rm-btn-sm" onClick={() => setContest(null)}>Change</button>
            </div>
          ) : (
            <div className="rm-picker">
              <div className="rm-search">
                <Glyph name="search" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by contest or platform" aria-label="Search contests" />
              </div>
              <ul className="rm-results">
                {results.length === 0 && <li className="rm-muted px-3 py-4">No contests match “{query}”.</li>}
                {results.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => pickContest(c)}>
                      <span className="rm-dot" style={{ background: colorOf(c.platform) }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-slate-100">{c.name}</span>
                        <span className="rm-muted text-xs">{c.platform} · {formatWhen(c.startTime)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errors.contest && <p className="rm-error">{errors.contest}</p>}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="room-name" className="rm-label">Room name</label>
          <input id="room-name" ref={nameRef} value={name} onChange={(e) => { setName(e.target.value); clearError('name'); }} maxLength={80} placeholder="e.g. Team Delta — Div. 2 practice" className={errors.name ? 'rm-input has-error' : 'rm-input'} />
          {errors.name && <p className="rm-error">{errors.name}</p>}
        </div>

        {/* Time + duration */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_150px]">
          <div>
            <label htmlFor="room-start" className="rm-label">Start time</label>
            <input id="room-start" type="datetime-local" value={startTime} onChange={(e) => { setStartTime(e.target.value); clearError('startTime'); }} className={errors.startTime ? 'rm-input has-error' : 'rm-input'} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[['In 15 min', 15], ['In 1 hour', 60], ['In 3 hours', 180]].map(([label, mins]) => (
                <button key={label} type="button" className="rm-chip" onClick={() => setQuickStart(mins)}>{label}</button>
              ))}
            </div>
            {errors.startTime && <p className="rm-error">{errors.startTime}</p>}
          </div>
          <div>
            <label htmlFor="room-duration" className="rm-label">Duration (min)</label>
            <input id="room-duration" type="number" min={10} max={600} value={duration} onChange={(e) => { setDuration(parseInt(e.target.value, 10) || 0); clearError('duration'); }} className={errors.duration ? 'rm-input has-error' : 'rm-input'} />
            {errors.duration && <p className="rm-error">{errors.duration}</p>}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <span className="rm-label">Who can join</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'Private', icon: 'lock', text: 'Only people with the code' },
              { v: 'Public', icon: 'globe', text: 'Listed for everyone' },
            ].map((o) => (
              <button key={o.v} type="button" className={visibility === o.v ? 'rm-option is-active' : 'rm-option'} onClick={() => setVisibility(o.v)} aria-pressed={visibility === o.v}>
                <Glyph name={o.icon} />
                <span className="text-left">
                  <span className="block font-medium text-slate-100">{o.v}</span>
                  <span className="block text-xs text-slate-500">{o.text}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Problems */}
        <div>
          <span className="rm-label">Problems</span>
          <ol className="grid gap-2">
            {problems.map((p, i) => (
              <li key={i} className="rm-problem">
                <span className="rm-problem-idx">{String.fromCharCode(65 + i)}</span>
                <input value={p.name} onChange={(e) => updateProblem(i, 'name', e.target.value)} placeholder="Problem name" aria-label={`Problem ${String.fromCharCode(65 + i)} name`} className="rm-input" />
                <input value={p.url} onChange={(e) => updateProblem(i, 'url', e.target.value)} placeholder="Link (optional)" aria-label={`Problem ${String.fromCharCode(65 + i)} link`} className="rm-input rm-problem-url" />
                <button type="button" className="rm-icon-btn" onClick={() => setProblems((list) => list.filter((_, idx) => idx !== i))} disabled={problems.length === 1} aria-label={`Remove problem ${String.fromCharCode(65 + i)}`}>
                  <Glyph name="x" />
                </button>
              </li>
            ))}
          </ol>
          {problems.length < 12 && (
            <button type="button" className="rm-add" onClick={() => setProblems((list) => [...list, { name: '', url: '' }])}>
              <Glyph name="plus" /> Add problem {String.fromCharCode(65 + problems.length)}
            </button>
          )}
          {errors.problems && <p className="rm-error">{errors.problems}</p>}
        </div>

        <div className="rm-modal-actions">
          <button type="button" className="rm-btn-text" onClick={onClose}>Cancel</button>
          <button type="submit" className="rm-btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : <>Create room <Glyph name="arrow" /></>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function JoinRoomModal({ onClose, onJoined }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => inputRef.current?.focus(), []);

  const submit = async (e) => {
    e.preventDefault();
    if (code.length !== 8) { setError('Invite codes are 8 characters.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { data } = await roomAPI.joinByCode(code);
      toast.success(data.message || 'Joined the room');
      onJoined(data.id);
    } catch (err) {
      setError(errorText(err, 'Could not join this room'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Join a room" subtitle="Enter the 8-character code your friend shared." onClose={onClose}>
      <form onSubmit={submit} noValidate className="rm-modal-body">
        <div>
          <label htmlFor="invite-code" className="sr-only">Invite code</label>
          <input
            id="invite-code"
            ref={inputRef}
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)); setError(''); }}
            placeholder="A1B2C3D4"
            autoComplete="off"
            spellCheck={false}
            className={error ? 'rm-input rm-code-input has-error' : 'rm-input rm-code-input'}
          />
          {error && <p className="rm-error text-center">{error}</p>}
        </div>
        <div className="rm-modal-actions">
          <button type="button" className="rm-btn-text" onClick={onClose}>Cancel</button>
          <button type="submit" className="rm-btn-primary" disabled={submitting || code.length === 0}>
            {submitting ? 'Joining…' : <>Join room <Glyph name="arrow" /></>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

.rm-root {
  --rm-line: rgba(255,255,255,0.07);
  --rm-line-strong: rgba(255,255,255,0.12);
  position: relative; overflow-x: clip; min-height: 100vh;
  background: #06070c; color: #cbd5e1;
  font-family: 'DM Sans', system-ui, sans-serif;
}
.rm-wrap { width: min(100% - 32px, 1240px); margin-inline: auto; }
.rm-glow {
  position: absolute; top: -220px; left: 30%; width: 900px; height: 520px; pointer-events: none;
  background: radial-gradient(closest-side, rgba(56,189,248,0.10), transparent),
              radial-gradient(closest-side at 80% 60%, rgba(52,211,153,0.07), transparent);
  filter: blur(30px);
}

.rm-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; }
.rm-h1 { font-weight: 700; color: #f8fafc; font-size: clamp(34px, 4.4vw, 52px); line-height: 1.06; letter-spacing: -0.035em; }
.rm-h2 { font-weight: 600; color: #f1f5f9; font-size: 20px; letter-spacing: -0.02em; }
.rm-h3 { font-weight: 600; color: #f1f5f9; font-size: 16px; }
.rm-lead { font-size: 17px; line-height: 1.6; color: #94a3b8; }
.rm-muted { font-size: 14px; line-height: 1.6; color: #7c879b; }
.rm-mono { font-family: 'JetBrains Mono', monospace; }

/* buttons */
.rm-btn-primary, .rm-btn-ghost {
  display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 999px;
  font-size: 14px; font-weight: 600; white-space: nowrap;
  transition: transform .2s ease, background .2s ease, border-color .2s ease, opacity .2s ease;
}
.rm-btn-primary { color: #04121c; background: linear-gradient(100deg, #7dd3fc, #6ee7b7); box-shadow: 0 10px 30px -12px rgba(56,189,248,0.6), inset 0 1px 0 rgba(255,255,255,0.5); }
.rm-btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
.rm-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
.rm-btn-ghost { color: #e2e8f0; border: 1px solid var(--rm-line-strong); background: rgba(255,255,255,0.02); }
.rm-btn-ghost:hover { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.05); }
.rm-btn-text { padding: 10px 14px; border-radius: 999px; font-size: 14px; font-weight: 500; color: #94a3b8; }
.rm-btn-text:hover { color: #f1f5f9; background: rgba(255,255,255,0.04); }
.rm-btn-sm { padding: 8px 14px; font-size: 13px; }
.rm-icon-btn { display: grid; place-items: center; flex-shrink: 0; width: 34px; height: 34px; border-radius: 10px; color: #94a3b8; }
.rm-icon-btn:hover:not(:disabled) { color: #f1f5f9; background: rgba(255,255,255,0.06); }
.rm-icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* filters */
.rm-filters { display: flex; gap: 4px; padding: 4px; border-radius: 14px; background: rgba(255,255,255,0.025); border: 1px solid var(--rm-line); overflow-x: auto; scrollbar-width: none; }
.rm-filter { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; padding: 7px 12px; border-radius: 10px; font-size: 14px; font-weight: 500; color: #94a3b8; transition: color .2s ease, background .2s ease; }
.rm-filter:hover { color: #f1f5f9; }
.rm-filter.is-active { color: #f0f9ff; background: rgba(56,189,248,0.14); box-shadow: inset 0 0 0 1px rgba(56,189,248,0.25); }
.rm-filter-count { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #64748b; }
.rm-filter.is-active .rm-filter-count { color: #7dd3fc; }

/* grid + cards */
.rm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 16px; }
.rm-panel { padding: 24px; border-radius: 22px; background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01)); border: 1px solid var(--rm-line); }
.rm-empty-small { color: #94a3b8; font-size: 15px; }
.rm-skeleton { height: 250px; border-radius: 22px; background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.05), rgba(255,255,255,0.02)); background-size: 200% 100%; animation: rm-shimmer 1.4s linear infinite; }
@keyframes rm-shimmer { to { background-position: -200% 0; } }

.rm-card {
  position: relative; display: flex; flex-direction: column; min-width: 0; padding: 22px; border-radius: 22px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.012));
  border: 1px solid var(--rm-line);
  transition: border-color .25s ease, transform .25s ease;
}
.rm-card:hover { border-color: var(--rm-line-strong); transform: translateY(-2px); }
.rm-card.is-live { border-color: rgba(248,113,113,0.3); box-shadow: 0 30px 80px -50px rgba(248,113,113,0.6); }
.rm-card.is-ended { opacity: 0.7; }
.rm-card-title { margin-top: 18px; font-weight: 600; font-size: 18px; color: #f8fafc; letter-spacing: -0.015em; overflow-wrap: anywhere; }
.rm-card-contest { margin-top: 4px; font-size: 14px; color: #7c879b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rm-meta { margin-top: 14px; font-size: 13px; color: #94a3b8; }
.rm-meta span { display: inline-flex; align-items: center; gap: 6px; }

.rm-status { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.rm-status.is-live { color: #fecaca; background: rgba(248,113,113,0.14); }
.rm-status.is-live i { width: 7px; height: 7px; border-radius: 99px; background: #f87171; animation: rm-pulse 1.8s ease-in-out infinite; }
@keyframes rm-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.6); } 50% { box-shadow: 0 0 0 5px rgba(248,113,113,0); } }
.rm-status.is-upcoming { color: #bae6fd; background: rgba(56,189,248,0.1); }
.rm-status.is-ended { color: #94a3b8; background: rgba(255,255,255,0.05); }
.rm-platform { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: #94a3b8; white-space: nowrap; }
.rm-platform > span { width: 8px; height: 8px; border-radius: 99px; }

.rm-capacity { margin-top: 18px; }
.rm-bar { margin-top: 8px; height: 5px; border-radius: 99px; background: rgba(255,255,255,0.06); overflow: hidden; }
.rm-bar span { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #7dd3fc, #6ee7b7); }
.rm-host { display: inline-flex; align-items: center; gap: 5px; color: #fcd34d; font-weight: 500; }
.rm-card-footer { margin-top: auto; padding-top: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.rm-code {
  display: inline-flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 10px;
  font-size: 13px; color: #cbd5e1; border: 1px dashed rgba(255,255,255,0.16); background: rgba(255,255,255,0.02);
  transition: border-color .2s ease, color .2s ease;
}
.rm-code:hover { border-color: rgba(56,189,248,0.5); color: #f0f9ff; }

/* onboarding */
.rm-onboarding { padding: 28px; }
.rm-step { padding: 20px; border-radius: 18px; background: rgba(255,255,255,0.02); border: 1px solid var(--rm-line); }
.rm-step-icon { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 16px; border-radius: 12px; color: #7dd3fc; background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.18); }

/* modal */
.rm-backdrop { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(2,4,8,0.7); backdrop-filter: blur(6px); }
.rm-modal {
  width: 100%; max-width: 440px; max-height: calc(100vh - 32px); overflow-y: auto;
  border-radius: 24px; background: #0b0d14; border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 40px 120px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(56,189,248,0.06);
  font-family: 'DM Sans', system-ui, sans-serif; color: #cbd5e1;
}
.rm-modal.is-wide { max-width: 640px; }
.rm-modal-head { position: sticky; top: 0; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 24px 24px 16px; background: #0b0d14; border-bottom: 1px solid var(--rm-line, rgba(255,255,255,0.07)); }
.rm-modal-body { display: grid; gap: 22px; padding: 22px 24px 24px; }
.rm-modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }
.rm-label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #cbd5e1; }
.rm-error { margin-top: 8px; font-size: 13px; color: #fca5a5; }
.rm-input {
  width: 100%; padding: 11px 13px; border-radius: 12px; font-size: 15px; color: #f1f5f9;
  background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.12); outline: none; color-scheme: dark;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.rm-input::placeholder { color: #475569; }
.rm-input:focus { border-color: rgba(56,189,248,0.6); box-shadow: 0 0 0 4px rgba(56,189,248,0.12); }
.rm-input.has-error { border-color: rgba(248,113,113,0.6); }
.rm-code-input { text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 26px; letter-spacing: 0.3em; padding: 16px; }
.rm-chip { padding: 5px 10px; border-radius: 999px; font-size: 12px; color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); }
.rm-chip:hover { color: #f1f5f9; border-color: rgba(56,189,248,0.4); }

.rm-picker { border-radius: 14px; border: 1px solid rgba(255,255,255,0.12); overflow: hidden; }
.rm-search { display: flex; align-items: center; gap: 10px; padding: 0 13px; color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.07); }
.rm-search input { flex: 1; min-width: 0; padding: 12px 0; background: transparent; outline: none; font-size: 15px; color: #f1f5f9; }
.rm-search input::placeholder { color: #475569; }
.rm-results { max-height: 220px; overflow-y: auto; }
.rm-results button { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 13px; text-align: left; font-size: 14px; }
.rm-results button:hover, .rm-results button:focus-visible { background: rgba(56,189,248,0.07); outline: none; }
.rm-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 99px; }
.rm-picked { display: flex; align-items: center; gap: 12px; padding: 8px 8px 8px 13px; border-radius: 14px; border: 1px solid rgba(56,189,248,0.35); background: rgba(56,189,248,0.06); font-size: 14px; }

.rm-option { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); transition: border-color .2s ease, background .2s ease; }
.rm-option:hover { border-color: rgba(255,255,255,0.22); }
.rm-option.is-active { color: #7dd3fc; border-color: rgba(56,189,248,0.5); background: rgba(56,189,248,0.07); }

.rm-problem { display: flex; align-items: center; gap: 8px; }
.rm-problem-idx { flex-shrink: 0; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #7dd3fc; background: rgba(56,189,248,0.08); }
.rm-problem .rm-input { padding: 9px 12px; font-size: 14px; }
.rm-add { margin-top: 8px; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 12px; font-size: 14px; color: #94a3b8; border: 1px dashed rgba(255,255,255,0.14); }
.rm-add:hover { color: #f1f5f9; border-color: rgba(56,189,248,0.4); }

@media (max-width: 640px) {
  .rm-problem { flex-wrap: wrap; }
  .rm-problem .rm-input { flex: 1 1 calc(100% - 84px); }
  .rm-problem .rm-problem-url { flex-basis: 100%; margin-left: 42px; }
  .rm-modal-head { padding: 20px 20px 14px; }
  .rm-modal-body { padding: 18px 20px 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .rm-skeleton, .rm-status.is-live i { animation: none; }
  .rm-card, .rm-btn-primary, .rm-filter, .rm-input { transition: none; }
}
`;
