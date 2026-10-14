import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { roomAPI } from '../api';
import useRoomStore from '../store/useRoomStore';
import { startConnection } from '../utils/signalr';
import CountdownRing from '../components/rooms/CountdownRing';
import WaitingIllustration from '../components/rooms/WaitingIllustration';

export default function RoomLobby() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { room, setRoom, members, setMembers, addMember, removeMember, timer, setTimer, resetRoom } = useRoomStore();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showGo, setShowGo] = useState(false);

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    try {
      const { data } = await roomAPI.getById(id);
      setRoom(data);
      setMembers(data.members || []);
    } catch (err) {
      toast.error('Failed to load room');
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  }, [id, setRoom, setMembers, navigate]);

  useEffect(() => {
    fetchRoom();
    return () => resetRoom();
  }, [fetchRoom, resetRoom]);

  // SignalR connection
  useEffect(() => {
    let conn;
    const setupSignalR = async () => {
      try {
        conn = await startConnection();
        await conn.invoke('JoinRoom', parseInt(id));

        conn.on('TimerSync', (data) => {
          setTimer(data);
        });

        conn.on('RoomStatusChanged', (data) => {
          if (data.status === 'Live') {
            // "GO!" burst
            setShowGo(true);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
            setTimeout(() => {
              navigate(`/rooms/${id}/live`);
            }, 1500);
          }
        });

        conn.on('MemberJoined', (data) => {
          addMember(data);
          toast.success(`${data.displayName} joined!`, { icon: '👋' });
        });

        conn.on('MemberLeft', (data) => {
          removeMember(data.userId);
        });
      } catch (err) {
        console.error('SignalR error:', err);
      }
    };

    setupSignalR();

    return () => {
      if (conn) {
        conn.invoke('LeaveRoom', parseInt(id)).catch(() => {});
        conn.off('TimerSync');
        conn.off('RoomStatusChanged');
        conn.off('MemberJoined');
        conn.off('MemberLeft');
      }
    };
  }, [id, setTimer, addMember, removeMember, navigate]);

  const copyInviteCode = () => {
    if (room?.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode);
      setCopied(true);
      toast.success('Invite code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/rooms/join/${room?.inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Share link copied!');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: '#64748b', fontSize: 14 }}>Loading room...</div>
      </div>
    );
  }

  const totalSeconds = room ? Math.max(0, Math.floor((new Date(room.startTime) - Date.now()) / 1000)) : 0;

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '40px 24px' }}>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.2); }
          50% { box-shadow: 0 0 30px 10px rgba(56,189,248,0.15); }
        }
      `}</style>

      {/* "GO!" Burst overlay */}
      <AnimatePresence>
        {showGo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                fontSize: 120, fontWeight: 900, color: '#38bdf8',
                textShadow: '0 0 60px rgba(56,189,248,0.5)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              GO!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px' }}
        >
          {room?.name}
        </motion.h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          {room?.contest?.platform} — {room?.contest?.name}
        </p>
      </div>

      {/* Countdown Ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
        <CountdownRing
          totalSeconds={totalSeconds > 0 ? totalSeconds : timer.totalSeconds || 3600}
          remainingSeconds={timer.remainingSeconds || totalSeconds}
          size={220}
          strokeWidth={10}
        />
      </div>

      {/* Invite Section */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 36,
      }}>
        <button onClick={copyInviteCode} style={{
          padding: '10px 20px', borderRadius: 10,
          border: '1px solid rgba(56,189,248,0.3)',
          background: 'rgba(56,189,248,0.08)',
          color: '#38bdf8', fontWeight: 700, fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.1em', cursor: 'pointer',
          transition: 'all 0.2s',
        }}>
          {copied ? '✓ Copied' : `📋 ${room?.inviteCode}`}
        </button>
        <button onClick={copyShareLink} style={{
          padding: '10px 20px', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          color: '#94a3b8', fontWeight: 600, fontSize: 13,
          cursor: 'pointer',
        }}>
          🔗 Copy Share Link
        </button>
      </div>

      {/* Members Grid */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,0.7), rgba(15,23,42,0.5))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
            Participants
          </h3>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#34d399',
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: 4, padding: '1px 6px',
          }}>
            {members.length}/{room?.maxMembers || 10}
          </span>
        </div>

        {members.length === 0 ? (
          <WaitingIllustration size={150} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {members.map((member, i) => (
              <motion.div
                key={member.userId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#0f172a',
                  position: 'relative', overflow: 'hidden', flexShrink: 0,
                }}>
                  {member.profilePictureUrl ? (
                    <img src={member.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    member.displayName?.charAt(0)?.toUpperCase() || '?'
                  )}
                  {/* Online dot */}
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#34d399', border: '2px solid #0f172a',
                  }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#e2e8f0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {member.displayName}
                  </div>
                  {member.role === 'Host' && (
                    <span style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700 }}>👑 Host</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Contest Info */}
      {room?.contest && (
        <div style={{
          marginTop: 20,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 16,
          display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#94a3b8',
        }}>
          <span>📝 {room.problems?.length || 0} problems</span>
          <span>⏱ {room.durationMinutes} min</span>
          <span>🌐 <a href={room.contest.url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>Original contest →</a></span>
        </div>
      )}
    </div>
  );
}
