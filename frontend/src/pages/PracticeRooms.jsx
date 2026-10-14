import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { roomAPI, contestAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import WaitingIllustration from '../components/rooms/WaitingIllustration';

/* ─── Platform badge colors ────────────────────────────────────── */
const PLAT_COLORS = {
  codeforces: '#FF4D4D',
  leetcode: '#FFA116',
  atcoder: '#00C896',
  codechef: '#A0855B',
  geeksforgeeks: '#0F9D58',
};

/* ─── Room status styles ───────────────────────────────────────── */
const STATUS_CFG = {
  Scheduled: { label: 'SCHEDULED', color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)' },
  Live:      { label: '● LIVE',     color: '#FF4D4D', bg: 'rgba(255,77,77,0.08)',    border: 'rgba(255,77,77,0.25)' },
  Ended:     { label: 'ENDED',     color: '#475569', bg: 'rgba(71,85,105,0.08)',    border: 'rgba(71,85,105,0.2)' },
};

export default function PracticeRooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await roomAPI.getAll();
      setRooms(data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const myRooms = rooms.filter(r => r.isMember);
  const publicRooms = rooms.filter(r => !r.isMember && r.visibility === 'Public');

  const handleRoomClick = (room) => {
    if (room.status === 'Scheduled') navigate(`/rooms/${room.id}/lobby`);
    else if (room.status === 'Live') navigate(`/rooms/${room.id}/live`);
    else navigate(`/rooms/${room.id}/summary`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060612' }}>
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '32px 24px' }}>
      <style>{`
        .pr-live-pulse {
          animation: live-pulse 2s ease-in-out infinite;
        }
        @keyframes live-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pr-live-pulse { animation: none; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
            Practice Rooms
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Re-sit past contests with friends in real-time
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowJoinModal(true)}
            style={{
              padding: '10px 20px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: '#e2e8f0', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            🔗 Join Room
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              color: '#0f172a', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            + Create Room
          </button>
        </div>
      </div>

      {/* My Rooms */}
      <Section title="My Rooms" count={myRooms.length}>
        {loading ? (
          <LoadingCards />
        ) : myRooms.length === 0 ? (
          <EmptyState message="You haven't joined any practice rooms yet." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {myRooms.map((room, i) => (
              <RoomCard key={room.id} room={room} index={i} onClick={() => handleRoomClick(room)} />
            ))}
          </div>
        )}
      </Section>

      {/* Public Rooms */}
      <Section title="Public Rooms" count={publicRooms.length}>
        {loading ? (
          <LoadingCards />
        ) : publicRooms.length === 0 ? (
          <EmptyState message="No public rooms available right now." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {publicRooms.map((room, i) => (
              <RoomCard key={room.id} room={room} index={i} onClick={() => handleRoomClick(room)} />
            ))}
          </div>
        )}
      </Section>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateRoomModal
            onClose={() => setShowCreateModal(false)}
            onCreated={(room) => {
              setShowCreateModal(false);
              fetchRooms();
              navigate(`/rooms/${room.id}/lobby`);
            }}
          />
        )}
        {showJoinModal && (
          <JoinRoomModal
            onClose={() => setShowJoinModal(false)}
            onJoined={(roomId) => {
              setShowJoinModal(false);
              fetchRooms();
              navigate(`/rooms/${roomId}/lobby`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

/* ─── Section wrapper ──────────────────────────────────────────── */
function Section({ title, count, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#cbd5e1', margin: 0 }}>{title}</h2>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#38bdf8',
          background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: 4, padding: '1px 6px',
        }}>
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ─── Room Card ────────────────────────────────────────────────── */
function RoomCard({ room, index, onClick }) {
  const statusCfg = STATUS_CFG[room.status] || STATUS_CFG.Scheduled;
  const platColor = PLAT_COLORS[room.contestPlatform?.toLowerCase()] || '#818cf8';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      style={{
        position: 'relative', cursor: 'pointer',
        background: 'linear-gradient(180deg, rgba(30,30,40,0.6), rgba(20,20,30,0.5))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: 18,
        transition: 'border-color 0.2s, transform 0.15s',
      }}
      whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.15)' }}
    >
      {/* Status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
          padding: '3px 8px', borderRadius: 5,
          background: statusCfg.bg, color: statusCfg.color,
          border: `1px solid ${statusCfg.border}`,
          fontFamily: "'JetBrains Mono', monospace",
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {room.status === 'Live' && (
            <span className="pr-live-pulse" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#FF4D4D' }} />
          )}
          {statusCfg.label}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, color: platColor,
          background: `${platColor}15`, border: `1px solid ${platColor}30`,
          borderRadius: 4, padding: '2px 6px',
        }}>
          {room.contestPlatform}
        </span>
      </div>

      {/* Room name */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>
        {room.name}
      </h3>
      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
        {room.contestName}
      </p>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8' }}>
        <span>👥 {room.memberCount}/{room.maxMembers}</span>
        <span>⏱ {new Date(room.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        {room.isHost && <span style={{ color: '#fbbf24' }}>👑 Host</span>}
      </div>
    </motion.div>
  );
}

/* ─── Empty state ──────────────────────────────────────────────── */
function EmptyState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <WaitingIllustration size={180} />
      <p style={{ color: '#475569', fontSize: 13, marginTop: 16 }}>{message}</p>
    </div>
  );
}

/* ─── Loading skeleton ─────────────────────────────────────────── */
function LoadingCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          height: 140, borderRadius: 14,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}

/* ─── Create Room Modal ────────────────────────────────────────── */
function CreateRoomModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [contestId, setContestId] = useState('');
  const [contests, setContests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(120);
  const [visibility, setVisibility] = useState('Private');
  const [problems, setProblems] = useState([{ index: 'A', name: '', url: '' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    contestAPI.getAll().then(({ data }) => setContests(data)).catch(() => {});
  }, []);

  const filteredContests = contests.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.platform.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 20);

  const addProblem = () => {
    const nextIdx = String.fromCharCode(65 + problems.length);
    setProblems([...problems, { index: nextIdx, name: '', url: '' }]);
  };

  const removeProblem = (i) => {
    if (problems.length <= 1) return;
    setProblems(problems.filter((_, idx) => idx !== i));
  };

  const updateProblem = (i, field, value) => {
    const next = [...problems];
    next[i] = { ...next[i], [field]: value };
    setProblems(next);
  };

  const handleCreate = async () => {
    if (!name.trim() || !contestId || !startTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await roomAPI.create({
        name: name.trim(),
        contestId: parseInt(contestId),
        startTime: new Date(startTime).toISOString(),
        durationMinutes: duration,
        visibility,
        problems: problems.filter(p => p.name.trim()),
      });
      toast.success(`Room created! Invite code: ${data.inviteCode}`);
      onCreated(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540, maxHeight: '85vh', overflow: 'auto',
          background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: 28, backdropFilter: 'blur(20px)',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: '0 0 20px' }}>
          Create Practice Room
        </h2>

        <ModalField label="Room Name *">
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Team Delta — CF 900 Practice"
            style={inputStyle}
          />
        </ModalField>

        <ModalField label="Select Contest *">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contests..."
            style={inputStyle}
          />
          {searchQuery && (
            <div style={{ maxHeight: 150, overflow: 'auto', marginTop: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)' }}>
              {filteredContests.map(c => (
                <div
                  key={c.id}
                  onClick={() => { setContestId(c.id); setSearchQuery(c.name); setDuration(c.duration); }}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: '#cbd5e1',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: contestId === c.id ? 'rgba(56,189,248,0.1)' : 'transparent',
                  }}
                >
                  <span style={{ color: PLAT_COLORS[c.platform?.toLowerCase()] || '#818cf8', fontWeight: 700, marginRight: 6 }}>
                    {c.platform}
                  </span>
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </ModalField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ModalField label="Start Time *">
            <input
              type="datetime-local" value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={inputStyle}
            />
          </ModalField>
          <ModalField label="Duration (min)">
            <input
              type="number" value={duration} min={10} max={600}
              onChange={(e) => setDuration(parseInt(e.target.value) || 120)}
              style={inputStyle}
            />
          </ModalField>
        </div>

        <ModalField label="Visibility">
          <div style={{ display: 'flex', gap: 8 }}>
            {['Private', 'Public'].map(v => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${visibility === v ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  background: visibility === v ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)',
                  color: visibility === v ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {v === 'Private' ? '🔒' : '🌐'} {v}
              </button>
            ))}
          </div>
        </ModalField>

        <ModalField label="Problems">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {problems.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', width: 20 }}>{p.index}</span>
                <input
                  value={p.name} onChange={(e) => updateProblem(i, 'name', e.target.value)}
                  placeholder="Problem name" style={{ ...inputStyle, flex: 2 }}
                />
                <input
                  value={p.url} onChange={(e) => updateProblem(i, 'url', e.target.value)}
                  placeholder="URL (optional)" style={{ ...inputStyle, flex: 2 }}
                />
                <button onClick={() => removeProblem(i)} style={{ border: 'none', background: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
              </div>
            ))}
            <button onClick={addProblem} style={{
              border: '1px dashed rgba(255,255,255,0.12)', background: 'none',
              color: '#64748b', borderRadius: 8, padding: 8, cursor: 'pointer', fontSize: 12,
            }}>
              + Add Problem
            </button>
          </div>
        </ModalField>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            color: '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={submitting} style={{
            flex: 1, padding: '12px', borderRadius: 10, border: 'none',
            background: submitting ? '#475569' : 'linear-gradient(135deg, #38bdf8, #818cf8)',
            color: '#0f172a', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer',
          }}>
            {submitting ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}

/* ─── Join Room Modal ──────────────────────────────────────────── */
function JoinRoomModal({ onClose, onJoined }) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) return toast.error('Enter an invite code');
    setSubmitting(true);
    try {
      const { data } = await roomAPI.joinByCode(code.trim());
      toast.success(data.message || 'Joined room!');
      onJoined(data.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join room');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400,
          background: 'rgba(15,20,35,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: 28, backdropFilter: 'blur(20px)',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: '0 0 16px' }}>
          Join Room
        </h2>
        <ModalField label="Invite Code">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABCD1234"
            maxLength={8}
            style={{ ...inputStyle, fontSize: 18, letterSpacing: '0.15em', textAlign: 'center', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}
          />
        </ModalField>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            color: '#94a3b8', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={handleJoin} disabled={submitting} style={{
            flex: 1, padding: '12px', borderRadius: 10, border: 'none',
            background: submitting ? '#475569' : 'linear-gradient(135deg, #38bdf8, #818cf8)',
            color: '#0f172a', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer',
          }}>
            {submitting ? 'Joining...' : 'Join'}
          </button>
        </div>
      </motion.div>
    </ModalBackdrop>
  );
}

/* ─── Shared modal bits ────────────────────────────────────────── */
function ModalBackdrop({ onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      {children}
    </motion.div>
  );
}

function ModalField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)', color: '#e2e8f0',
  fontSize: 13, outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.2s', boxSizing: 'border-box',
};
